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
import type { View } from '@/lib/types';
import { ChevronRight, Wand } from 'lucide-react';
import React, { useState } from 'react';
import { RefinementWizard } from '../shared/refinement-wizard';
import { PromptStatusBar } from '../shared/prompt-status-bar';

interface RefineViewProps {
  setView: (view: View) => void;
}

export function RefineView({ setView }: RefineViewProps) {
  const [promptText, setPromptText] = useState(
    'Write a short story about a dragon.'
  );
  const { toast } = useToast();

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
          <CardContent className="flex flex-col gap-2 flex-1">
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
          <div className="flex items-center gap-4 p-4 border-t">
            <PromptStatusBar />
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
        <Card className="flex flex-col overflow-hidden">
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
