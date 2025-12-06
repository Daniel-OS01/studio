'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wand, AlertTriangle, RefreshCw, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { refinePrompt } from '@/ai/flows/refine-prompt';
import type { AppSettings, RefinementStep } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface RefinePromptWizardProps {
  promptText: string;
  onApplySuggestion: (suggestionText: string) => void;
}

export function RefinePromptWizard({ promptText, onApplySuggestion }: RefinePromptWizardProps) {
  const [isRefining, startRefining] = useTransition();
  const [refinementStep, setRefinementStep] = useState<RefinementStep | null>(null);
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

  const handleGetRefinement = () => {
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
      setRefinementStep(null);
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
        
        if (result) {
          setRefinementStep(result);
        } else {
            setError("Could not generate a refinement suggestion. The AI may not have found specific ways to improve this prompt.");
        }
      } catch (e) {
        console.error(e);
        setError("An error occurred while generating a refinement step. Please check your API key and try again.");
        toast({
          title: "Refinement Failed",
          description: "Could not generate a refinement suggestion. Please try again later.",
          variant: "destructive",
        });
      }
    });
  };

  const handleOptionClick = (text: string) => {
    onApplySuggestion(text);
    setRefinementStep(null); // Clear the step to show the "Refine Further" button
    toast({
        title: "Suggestion Applied",
        description: "The refinement has been added to your prompt.",
    });
  };

  const stepData = refinementStep;

  if (isRefining) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Loader2 className="animate-spin h-8 w-8" />
        <p>Generating refinement wizard...</p>
      </div>
    );
  }

  if (error && !refinementStep) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <p className='text-center max-w-sm'>{error}</p>
              <Button onClick={handleGetRefinement} variant="secondary">Try Again</Button>
          </div>
      )
  }

  if (!stepData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Wand className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Refine Your Prompt</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Start an interactive wizard that will ask you questions to help improve and add detail to your prompt.
        </p>
        <Button onClick={handleGetRefinement} disabled={isRefining || !promptText.trim()}>
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

        <div className="flex-1 space-y-2 overflow-y-auto pr-2">
            {stepData.options.map((option, index) => (
            <Card 
                key={index}
                onClick={() => handleOptionClick(option.text)}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <CardHeader className="p-3">
                    <CardTitle className="text-base font-semibold">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-sm">
                    <p className="font-mono text-xs bg-muted/50 p-2 rounded-md mb-2">
                       + "{option.text.trim()}"
                    </p>
                    <div className='flex items-start gap-2 text-muted-foreground'>
                        <Lightbulb className="flex-shrink-0 mt-1"/>
                        <p className="text-xs">{option.example}</p>
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
        
        <div className="flex items-center justify-end mt-4">
            <Button 
                variant="ghost" 
                onClick={handleGetRefinement}
                disabled={isRefining}
            >
                <RefreshCw className="mr-2 h-4 w-4" /> Get another suggestion
            </Button>
        </div>
    </div>
  );
}
