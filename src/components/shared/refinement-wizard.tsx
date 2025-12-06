'use client';

import { generateRefinementOptions } from '@/ai/flows/generate-refinement-options';
import { refinePrompt } from '@/ai/flows/refine-prompt';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type {
  AppSettings,
  GenerateRefinementOptionsOutput,
  RefinePromptOutput,
} from '@/lib/types';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';
import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface RefinementWizardProps {
  initialPrompt: string;
  onPromptUpdate: (updater: (prev: string) => string) => void;
}

type WizardStep =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string }
  | { type: 'options'; data: GenerateRefinementOptionsOutput; topic: string }
  | { type: 'suggestions'; data: RefinePromptOutput }
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
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string>
  >({});
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    Record<number, string>
  >({});
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
    setSelectedOptions({});
    setSelectedSuggestions({});
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
            e.message ||
            'Failed to generate refinement options. Please check your API key.',
        });
      }
    });
  }, [initialPrompt, getApiKeys, toast, settings.models.analysis]);

  const handleOptionSelect = (questionIndex: number, optionTitle: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionIndex]: optionTitle,
    }));
  };

  const handleSuggestionSelect = (questionIndex: number, optionText: string) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [questionIndex]: optionText,
    }))
  };

  const handleApplySuggestions = () => {
    const allSuggestions = Object.values(selectedSuggestions).join(' ');
    onPromptUpdate(prev => `${prev.trim()} ${allSuggestions.trim()}`);
    toast({
      title: 'Suggestions Applied!',
      description: 'Your prompt has been updated with the selected refinements.',
    });
    setStep({ type: 'finished' });
  };

  const handleNextStep = useCallback(() => {
    const currentQuestionCount = step.type === 'options' ? step.data.length : 0;
    if (Object.keys(selectedOptions).length < currentQuestionCount) {
      toast({
        title: 'Selections missing',
        description: 'Please select an option for each question.',
        variant: 'destructive',
      });
      return;
    }

    const selections = Object.values(selectedOptions);
    const newHistory = [...history, ...selections];
    setHistory(newHistory);
    setSelectedOptions({});
    const nextStepIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextStepIndex);

    if (nextStepIndex < WIZARD_FLOW.length) {
      setStep({
        type: 'loading',
        message: `Generating options for ${WIZARD_FLOW[nextStepIndex].topic}...`,
      });
      startTransition(async () => {
        try {
          const result = await generateRefinementOptions({
            prompt: initialPrompt,
            topic: WIZARD_FLOW[nextStepIndex].topic,
            history: newHistory,
            apiKeys: getApiKeys(),
            modelName: settings.models.analysis,
          });
          setStep({
            type: 'options',
            data: result,
            topic: WIZARD_FLOW[nextStepIndex].topic,
          });
        } catch (e: any) {
          setStep({
            type: 'error',
            message: e.message || 'Failed to load next step.',
          });
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
          setStep({
            type: 'error',
            message: e.message || 'Failed to get final suggestions.',
          });
        }
      });
    }
  }, [
    currentStepIndex,
    history,
    initialPrompt,
    getApiKeys,
    settings.models.analysis,
    selectedOptions,
    step,
    toast,
  ]);

  const handleBack = () => {
    if (step.type === 'suggestions') {
      const prevStepIndex = WIZARD_FLOW.length - 1;
      const newHistory = history.slice(
        0,
        history.length - Object.keys(selectedOptions).length
      );
      setCurrentStepIndex(prevStepIndex);
      setHistory(newHistory);
      setSelectedOptions({});
      setStep({ type: 'loading', message: 'Going back...' });
      startTransition(async () => {
        const result = await generateRefinementOptions({
          prompt: initialPrompt,
          topic: WIZARD_FLOW[prevStepIndex].topic,
          history: newHistory,
          apiKeys: getApiKeys(),
          modelName: settings.models.analysis,
        });
        setStep({
          type: 'options',
          data: result,
          topic: WIZARD_FLOW[prevStepIndex].topic,
        });
      });
      return;
    }

    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      // This history logic might need adjustment depending on how many selections were made in the previous step
      const newHistory = []; // Simple reset for now
      setCurrentStepIndex(prevStepIndex);
      setHistory(newHistory);
      setSelectedOptions({});
      setStep({ type: 'loading', message: 'Loading previous step...' });
      startTransition(async () => {
        try {
          const result = await generateRefinementOptions({
            prompt: initialPrompt,
            topic: WIZARD_FLOW[prevStepIndex].topic,
            history: newHistory,
            apiKeys: getApiKeys(),
            modelName: settings.models.analysis,
          });
          setStep({
            type: 'options',
            data: result,
            topic: WIZARD_FLOW[prevStepIndex].topic,
          });
        } catch (e: any) {
          setStep({
            type: 'error',
            message: e.message || 'Could not go back.',
          });
        }
      });
    } else {
      setStep({ type: 'idle' });
    }
  };

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
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg p-8 w-full">
              <h3 className="font-semibold text-lg">Start the Wizard</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Enter a prompt on the left and click below to begin the guided
                refinement process.
              </p>
              <Button
                onClick={startWizard}
                disabled={isGenerating || !initialPrompt.trim()}
              >
                <Sparkles />
                Start Wizard
              </Button>
            </div>
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
        );

      case 'options':
        const questions = step.data;
        const allQuestionsAnswered =
          Object.keys(selectedOptions).length === questions.length;

        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4 shrink-0">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex-1 text-center font-bold">
                {WIZARD_FLOW[currentStepIndex].title}
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {questions.map((question, qIndex) => (
                <Card key={qIndex}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {question.icon && (
                        <span className="text-lg">{question.icon}</span>
                      )}{' '}
                      {question.title}
                    </CardTitle>
                    <CardDescription>{question.explanation}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map((option, oIndex) => (
                      <Button
                        key={oIndex}
                        variant={
                          selectedOptions[qIndex] === option.title
                            ? 'default'
                            : 'outline'
                        }
                        className="w-full text-left h-auto py-2 whitespace-normal flex items-start"
                        onClick={() => handleOptionSelect(qIndex, option.title)}
                      >
                        {option.icon && (
                          <span className="text-xl mr-3">{option.icon}</span>
                        )}
                        <span>{option.title}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="pt-4 flex justify-end shrink-0">
              <Button
                onClick={handleNextStep}
                disabled={!allQuestionsAnswered || isGenerating}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        );

      case 'suggestions':
        const allSuggestionsAnswered = Object.keys(selectedSuggestions).length === step.data.length;
        return (
          <div className="space-y-4 h-full flex flex-col">
             <div className="flex items-center mb-2 shrink-0">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex-1 text-center font-bold">
                Step 3: Apply Refinements
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {step.data.map((question, qIndex) => (
                <Card key={qIndex}>
                  <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                      {question.title}
                    </CardTitle>
                    <CardDescription>{question.explanation}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map((option, oIndex) => (
                      <Card
                        key={oIndex}
                        className="cursor-pointer hover:bg-muted/50 transition-colors flex flex-col data-[selected=true]:ring-2 data-[selected=true]:ring-primary"
                        data-selected={selectedSuggestions[qIndex] === option.text}
                        onClick={() => handleSuggestionSelect(qIndex, option.text)}
                      >
                        <CardHeader className="p-3 flex-1 flex flex-row items-start gap-3 space-y-0">
                          {option.icon && <span className="text-xl mt-1">{option.icon}</span>}
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold">
                              {option.title}
                            </CardTitle>
                             <p className="text-xs font-style: italic text-muted-foreground/80">
                              {option.example}
                            </p>
                          </div>
                          {selectedSuggestions[qIndex] === option.text && <Check className="h-5 w-5 text-primary" />}
                        </CardHeader>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
             <div className="pt-4 flex justify-end shrink-0">
              <Button
                onClick={handleApplySuggestions}
                disabled={!allSuggestionsAnswered || isGenerating}
              >
                <Sparkles /> Finish & Apply
              </Button>
            </div>
          </div>
        );

      case 'finished':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Check className="h-12 w-12 text-green-500" />
            <h3 className="font-semibold text-lg">Refinement Complete!</h3>
            <p className="text-muted-foreground max-w-sm">
              Your prompt has been updated. You can refine it further or start
              over.
            </p>
            <Button onClick={startWizard}>Start Over</Button>
          </div>
        );
    }
  };

  return <>{renderStep()}</>;
}
