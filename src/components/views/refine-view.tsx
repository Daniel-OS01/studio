'use client';

import {
  generateRefinementLevels,
} from '@/ai/flows/generate-refinement-levels';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings, MultiLevelRefinement, View } from '@/lib/types';
import {
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  Loader2,
  Sparkles,
  Wand,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';

interface RefineViewProps {
  setView: (view: View) => void;
}

export function RefineView({ setView }: RefineViewProps) {
  const [promptText, setPromptText] = useState('');
  const [refinement, setRefinement] = useState<MultiLevelRefinement | null>(
    null
  );
  const [isGenerating, startGenerating] = useTransition();
  const [error, setError] = useState<string | null>(null);
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

  const handleGenerateWizard = () => {
    if (!promptText.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to refine.',
        variant: 'destructive',
      });
      return;
    }

    startGenerating(async () => {
      setError(null);
      setRefinement(null);
      try {
        const activeKey =
          settings.apiKeys?.[settings.activeApiKeyIndex]?.key ?? '';
        const otherKeys =
          settings.apiKeys?.filter(
            (_, i) => i !== settings.activeApiKeyIndex
          ) ?? [];
        const orderedApiKeys = [activeKey, ...otherKeys.map((k) => k.key)];

        const result = await generateRefinementLevels({
          prompt: promptText,
          apiKeys: orderedApiKeys.filter(Boolean),
        });

        if (result && result.levels.length > 0) {
          setRefinement(result);
        } else {
          setError(
            'Could not generate refinement steps. The AI may not have found specific ways to improve this prompt.'
          );
        }
      } catch (e) {
        console.error(e);
        const errorMessage =
          e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(
          `An error occurred while generating the wizard. Please check your API key and try again. Details: ${errorMessage}`
        );
        toast({
          title: 'Refinement Failed',
          description:
            'Could not generate the refinement wizard. Please try again later.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleApplySuggestion = (textToAppend: string) => {
    setPromptText((prev) => `${prev.trim()} ${textToAppend.trim()}`);
    toast({
      title: 'Suggestion Applied',
      description: 'Your prompt has been updated.',
    });
  };

  const handleGoToStudio = () => {
    // This is a placeholder to demonstrate moving the prompt.
    // In a real app, you might use a shared state management solution.
    toast({
      title: 'Sent to Studio',
      description: 'Your refined prompt is ready in the Studio view. (Demo)',
    });
    setView('studio');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-foreground flex items-center gap-2">
          <Wand />
          Prompt Refinement Wizard
        </h1>
        <p className="text-muted-foreground">
          Iteratively improve your prompt through a guided, multi-level
          process.
        </p>
      </header>

      <main className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left Panel: Prompt Input & Display */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Your Prompt</CardTitle>
            <CardDescription>
              Enter your initial prompt below to start the wizard, or see your
              progress here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="prompt-text">Prompt</Label>
              <Textarea
                id="prompt-text"
                placeholder="e.g., Write a story about a dragon."
                className="h-full resize-none"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerateWizard} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                {refinement ? 'Restart Wizard' : 'Start Wizard'}
              </Button>
              <Button
                onClick={handleGoToStudio}
                variant="outline"
                className="ml-auto"
                disabled={!promptText}
              >
                Use in Studio <ChevronRight />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Wizard Steps */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Refinement Levels</CardTitle>
            <CardDescription>
              Choose one suggestion from each level to build your prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <Loader2 className="animate-spin h-8 w-8" />
                <p>Generating refinement wizard...</p>
                <p className="text-xs max-w-sm text-center">
                  This may take a moment as the AI generates three cumulative
                  levels of suggestions.
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive text-center">
                <AlertTriangle className="h-8 w-8" />
                <p className="font-semibold">Failed to Generate Wizard</p>
                <p className="text-sm max-w-md">{error}</p>
                <Button onClick={handleGenerateWizard} variant="secondary">
                  Try Again
                </Button>
              </div>
            ) : refinement ? (
              <Accordion type="single" collapsible className="w-full">
                {refinement.levels.map((level, levelIndex) => (
                  <AccordionItem
                    value={`level-${levelIndex + 1}`}
                    key={levelIndex}
                  >
                    <AccordionTrigger className="text-lg font-headline">
                      {level.levelTitle}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-muted-foreground text-sm">
                        {level.levelExplanation}
                      </p>
                      {level.options.map((option, optionIndex) => (
                        <Card
                          key={optionIndex}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group"
                          onClick={() => handleApplySuggestion(option.text)}
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
                            <CardDescription className="text-xs pt-1">
                              {option.explanation}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-sm">
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Lightbulb className="flex-shrink-0 mt-0.5" />
                              <p className="text-xs font-style: italic">
                                Example: {option.example}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Wand className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">
                  Start the Wizard to See Suggestions
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Enter a prompt on the left and click "Start Wizard" to begin
                  the guided refinement process.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
