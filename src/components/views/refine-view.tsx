'use client';

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
import { useToast } from '@/hooks/use-toast';
import type { AppSettings, Prompt, View } from '@/lib/types';
import { ChevronRight, Loader2, Save, Wand } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { RefinementWizard } from '../shared/refinement-wizard';
import { PromptStatusBar } from '../shared/prompt-status-bar';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generatePromptName } from '@/ai/flows/generate-prompt-name';

interface RefineViewProps {
  setView: (view: View) => void;
}

export function RefineView({ setView }: RefineViewProps) {
  const [promptText, setPromptText] = useState(
    'Write a short story about a dragon.'
  );
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  const [settings] = useLocalStorage<AppSettings>('prompt-forge-settings', {
    apiKeys: [],
    activeApiKeyIndex: 0,
    models: {
      analysis: 'gemini-2.5-flash',
      metrics: 'gemini-2.5-flash',
      recommendations: 'gemini-2.5-flash',
    },
  });

  const [, setLocalPrompts] = useLocalStorage<Prompt[]>(
    'prompt-forge-library',
    []
  );

  const getApiKeys = () => {
    const activeKey = settings.apiKeys?.[settings.activeApiKeyIndex]?.key ?? '';
    const otherKeys =
      settings.apiKeys
        ?.filter((_, i) => i !== settings.activeApiKeyIndex)
        .map((k) => k.key) ?? [];
    return [activeKey, ...otherKeys].filter(Boolean);
  };

  const handleGoToStudio = () => {
    toast({
      title: 'Sent to Studio',
      description: 'Your refined prompt is ready in the Studio view. (Demo)',
    });
    setView('studio');
  };

  const handleSaveToLibrary = () => {
    if (!promptText.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to save.',
        variant: 'destructive',
      });
      return;
    }

    startSaving(async () => {
      try {
        const { name } = await generatePromptName({
          prompt: promptText,
          apiKeys: getApiKeys(),
          modelName: settings.models.analysis,
        });

        const newPrompt: Prompt = {
          id: Date.now().toString(),
          name: name,
          text: promptText,
          createdAt: new Date().toISOString(),
        };

        setLocalPrompts((prev) => [newPrompt, ...prev]);

        toast({
          title: 'Prompt Saved!',
          description: `"${name}" has been added to your local library.`,
        });
      } catch (error) {
        toast({
          title: 'Failed to Save',
          description:
            'Could not automatically name and save the prompt. Please try again.',
          variant: 'destructive',
        });
        console.error(error);
      }
    });
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

      <main className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
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
            <Label htmlFor="prompt-text">Prompt</Label>
            <div className="grid gap-2 flex-1">
              <Textarea
                id="prompt-text"
                placeholder="e.g., Write a story about a dragon."
                className="h-full resize-none"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
            </div>
          </CardContent>
          <div className="flex items-center gap-4 p-4 border-t mt-auto">
            <PromptStatusBar />
            <Button
              onClick={handleSaveToLibrary}
              variant="outline"
              disabled={isSaving || !promptText}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save to Library
            </Button>
            <Button
              onClick={handleGoToStudio}
              variant="outline"
              disabled={!promptText}
              className="ml-auto"
            >
              Use in Studio <ChevronRight />
            </Button>
          </div>
        </Card>


        {/* Right Panel: Wizard Steps */}
        <Card className="flex flex-col overflow-y-auto">
          <CardHeader>
            <CardTitle>Refinement Wizard</CardTitle>
            <CardDescription>
              Follow the steps to improve your prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-y-auto">
            <RefinementWizard
              initialPrompt={promptText}
              onPromptUpdate={setPromptText}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
