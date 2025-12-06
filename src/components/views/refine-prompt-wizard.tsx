'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Wand, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { refinePrompt } from '@/ai/flows/refine-prompt';
import type { AppSettings, RefinementStep } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface RefinePromptWizardProps {
  promptText: string;
  onApplySuggestion: (suggestionText: string) => void;
}

export function RefinePromptWizard({ promptText, onApplySuggestion }: RefinePromptWizardProps) {
  const [isRefining, startRefining] = useTransition();
  const [refinementSteps, setRefinementSteps] = useState<RefinementStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const [settings] = useLocalStorage<AppSettings>("prompt-forge-settings", {
    apiKeys: [],
    activeApiKeyIndex: 0,
    models: {
      analysis: "gemini-2.5-flash",
      metrics: "gemini-2.5-flash",
      recommendations: "gemini-2.5-flash",
    },
  });

  const handleStartRefining = () => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt before refining.",
        variant: "destructive",
      });
      return;
    }

    startRefining(async () => {
      setError(null);
      setRefinementSteps([]);
      try {
        const activeKey =
          settings.apiKeys?.[settings.activeApiKeyIndex]?.key ?? "";
        const otherKeys =
          settings.apiKeys?.filter((_, i) => i !== settings.activeApiKeyIndex) ??
          [];
        const orderedApiKeys = [activeKey, ...otherKeys.map((k) => k.key)];

        const result = await refinePrompt({
          prompt: promptText,
          apiKeys: orderedApiKeys.filter(Boolean),
        });
        
        if (result.refinementSteps && result.refinementSteps.length > 0) {
          setRefinementSteps(result.refinementSteps);
          setCurrentStep(0);
        } else {
            setError("Could not generate refinement suggestions. The AI may not have found specific ways to improve this prompt.");
        }
      } catch (e) {
        console.error(e);
        setError("An error occurred while generating refinement steps. Please check your API key and try again.");
        toast({
          title: "Refinement Failed",
          description: "Could not generate refinement suggestions. Please try again later.",
          variant: "destructive",
        });
      }
    });
  };

  const handleOptionClick = (text: string) => {
    onApplySuggestion(text);
    toast({
        title: "Suggestion Applied",
        description: "The refinement has been added to your prompt.",
    });
  };

  const stepData = refinementSteps[currentStep];

  if (isRefining) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Loader2 className="animate-spin h-8 w-8" />
        <p>Generating refinement wizard...</p>
      </div>
    );
  }

  if (error && refinementSteps.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <p className='text-center max-w-sm'>{error}</p>
              <Button onClick={handleStartRefining} variant="secondary">Try Again</Button>
          </div>
      )
  }

  if (refinementSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Wand className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Refine Your Prompt</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Start an interactive wizard that will ask you questions to help improve and add detail to your prompt.
        </p>
        <Button onClick={handleStartRefining} disabled={isRefining}>
          {isRefining ? <Loader2 className="animate-spin" /> : <Wand />}
          Start Refining
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className='mb-4'>
            <h3 className="font-headline text-xl">{stepData.title}</h3>
            <p className="text-muted-foreground text-sm">{stepData.explanation}</p>
        </div>

        <div className="flex-1 space-y-2">
            {stepData.options.map((option, index) => (
            <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => handleOptionClick(option.text)}
            >
                {option.title}
            </Button>
            ))}
        </div>
        
        <div className="flex items-center justify-between mt-4">
            <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(s => s-1)} 
                disabled={currentStep === 0}
            >
                <ArrowLeft /> Back
            </Button>
            <p className='text-sm text-muted-foreground'>Step {currentStep + 1} of {refinementSteps.length}</p>
            <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(s => s+1)} 
                disabled={currentStep === refinementSteps.length - 1}
            >
                Next <ArrowRight />
            </Button>
        </div>

    </div>
  );
}
