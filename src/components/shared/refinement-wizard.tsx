'use client';

import { generateRefinementOptions } from '@/ai/flows/generate-refinement-options';
import { refinePrompt } from '@/ai/flows/refine-prompt';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings, RefinementOptions, RefinementStep } from '@/lib/types';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface RefinementWizardProps {
  initialPrompt: string;
  onPromptUpdate: (updater: (prev: string) => string) => void;
}

type WizardStep =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string }
  | { type: 'options'; data: RefinementOptions; topic: string }
  | { type: 'suggestions'; data: RefinementStep }
  | { type: 'finished' };

const WIZARD_FLOW: { topic: string; title: string }[] = [
  { topic: 'Primary Goal', title: 'Step 1: Define the Goal' },
  { topic: 'Audience', title: 'Step 2: Specify the Audience' },
];

export function RefinementWizard({
  initialPrompt,
  onPromptUpdate,
}: RefinementWizardProps) {
  const [step, setStep] = useState<WizardStep>({ type: 'idle' });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();

  const [settings] = useLocalStorage<AppSettings>('prompt-forge-settings', {
    apiKeys: [],
    activeApiKeyIndex: 0,
    models: {
      analysis: 'gemini-2.5-flash',
      metrics: 'gemini-2.5-flash',
      recommendations: 'gemini-2.5-flash',
    },
  });

  const getApiKeys = useCallback(() => {
    const activeKey = settings.apiKeys?.[settings.activeApiKeyIndex]?.key ?? '';
    const otherKeys =
      settings.apiKeys
        ?.filter((_, i) => i !== settings.activeApiKeyIndex)
        .map((k) => k.key) ?? [];
    return [activeKey, ...otherKeys].filter(Boolean);
  }, [settings.apiKeys, settings.activeApiKeyIndex]);

  const startWizard = useCallback(() => {
    if (!initialPrompt.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to start the wizard.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStepIndex(0);
    setHistory([]);
    setStep({ type: 'loading', message: 'Generating initial options...' });

    startTransition(async () => {
      try {
        const result = await generateRefinementOptions({
          prompt: initialPrompt,
          topic: WIZARD_FLOW[0].topic,
          history: [],
          apiKeys: getApiKeys(),
          modelName: settings.models.analysis,
        });
        setStep({ type: 'options', data: result, topic: WIZARD_FLOW[0].topic });
      } catch (e: any) {
        setStep({
          type: 'error',
          message:
            e.message || 'Failed to generate refinement options. Please check your API key.',
        });
      }
    });
  }, [initialPrompt, getApiKeys, toast, settings.models.analysis]);

  const handleOptionSelect = useCallback((optionTitle: string) => {
    const newHistory = [...history, optionTitle];
    setHistory(newHistory);
    const nextStepIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextStepIndex);

    if (nextStepIndex < WIZARD_FLOW.length) {
       setStep({ type: 'loading', message: `Generating options for ${WIZARD_FLOW[nextStepIndex].topic}...` });
       startTransition(async () => {
        try {
            const result = await generateRefinementOptions({
                prompt: initialPrompt,
                topic: WIZARD_FLOW[nextStepIndex].topic,
                history: newHistory,
                apiKeys: getApiKeys(),
                modelName: settings.models.analysis,
            });
            setStep({ type: 'options', data: result, topic: WIZARD_FLOW[nextStepIndex].topic });
        } catch (e:any) {
            setStep({ type: 'error', message: e.message || "Failed to load next step."})
        }
       });
    } else {
      // Final step: get concrete suggestions
      setStep({ type: 'loading', message: 'Generating final suggestions...' });
      startTransition(async () => {
        try {
          const result = await refinePrompt({
            prompt: initialPrompt,
            refinementGoal: newHistory.join(', '),
            apiKeys: getApiKeys(),
            modelName: settings.models.analysis,
          });
          setStep({ type: 'suggestions', data: result });
        } catch (e: any) {
          setStep({ type: 'error', message: e.message || 'Failed to get final suggestions.' });
        }
      });
    }
  }, [currentStepIndex, history, initialPrompt, getApiKeys, settings.models.analysis]);

  const handleSuggestionApply = (text: string) => {
    onPromptUpdate(
      (prev) => `${prev.trim()} ${text.trim()}`
    );
    toast({
      title: 'Suggestion Applied!',
      description: 'Your prompt has been updated.',
    });
    setStep({ type: 'finished' });
  };
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
        const prevStepIndex = currentStepIndex - 1;
        const newHistory = history.slice(0, -1);
        setCurrentStepIndex(prevStepIndex);
        setHistory(newHistory);
        setStep({ type: 'loading', message: 'Loading previous step...'});
        startTransition(async () => {
            try {
                const result = await generateRefinementOptions({
                    prompt: initialPrompt,
                    topic: WIZARD_FLOW[prevStepIndex].topic,
                    history: newHistory,
                    apiKeys: getApiKeys(),
                    modelName: settings.models.analysis,
                });
                setStep({ type: 'options', data: result, topic: WIZARD_FLOW[prevStepIndex].topic });
            } catch(e: any) {
                setStep({ type: 'error', message: e.message || "Could not go back."});
            }
        });
    } else {
        setStep({ type: 'idle' });
    }
  }

  // Effect to reset wizard if the prompt text is cleared
  useEffect(() => {
    if (!initialPrompt.trim()) {
      setStep({ type: 'idle' });
    }
  }, [initialPrompt]);


  const renderStep = () => {
    switch (step.type) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h3 className="font-semibold text-lg">Start the Wizard</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Enter a prompt on the left and click below to begin the guided
              refinement process.
            </p>
            <Button onClick={startWizard} disabled={isGenerating || !initialPrompt.trim()}>
              <Sparkles />
              Start Wizard
            </Button>
          </div>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8" />
            <p>{step.message}</p>
          </div>
        );
      
      case 'error':
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive text-center">
                <AlertTriangle className="h-8 w-8" />
                <p className="font-semibold">Wizard Error</p>
                <p className="text-sm max-w-md">{step.message}</p>
                <Button onClick={startWizard} variant="secondary">
                  Try Again
                </Button>
              </div>
        )

      case 'options':
        return (
            <div className="space-y-4">
                 <Button onClick={handleBack} variant="ghost" size="sm" className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h3 className="font-semibold text-lg">{step.data.title}</h3>
                <p className="text-sm text-muted-foreground">{step.data.explanation}</p>
                <div className="flex flex-wrap gap-2">
                    {step.data.options.map(option => (
                        <Button 
                            key={option.title}
                            variant="outline"
                            onClick={() => handleOptionSelect(option.title)}
                        >
                            {option.icon && <span>{option.icon}</span>}
                            {option.title}
                        </Button>
                    ))}
                </div>
            </div>
        );

    case 'suggestions':
        return (
            <div className="space-y-4">
                 <Button onClick={handleBack} variant="ghost" size="sm" className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h3 className="font-semibold text-lg">{step.data.title}</h3>
                <p className="text-sm text-muted-foreground">{step.data.explanation}</p>
                <div className="space-y-3">
                    {step.data.options.map((option, index) => (
                        <Card
                        key={index}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group"
                        onClick={() => handleSuggestionApply(option.text)}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-base font-semibold flex items-center justify-between">
                            {option.title}
                            <Button
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Apply
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm">
                            <p className="text-xs font-style: italic text-muted-foreground">
                              Example: {option.example}
                            </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
            </div>
        );
    
      case 'finished':
        return (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <Check className="h-12 w-12 text-green-500"/>
                <h3 className="font-semibold text-lg">
                  Refinement Complete!
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Your prompt has been updated. You can refine it further or start over.
                </p>
                <Button onClick={startWizard}>
                    Start Over
                </Button>
              </div>
        )
    }
  };

  return <>{renderStep()}</>;
}
