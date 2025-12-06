
"use client"

import { ClientOnly } from "@/components/shared/client-only"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import type { AppSettings, Prompt, View } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Plus, Trash2, Sparkles, Loader2, Copy, Edit } from "lucide-react"
import React, { useEffect, useState, useTransition, useCallback } from "react"
import { generatePromptName } from "@/ai/flows/generate-prompt-name"

interface CompactPromptCardProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
  onCopy: () => void
}

function CompactPromptCard({ prompt, isSelected, onClick, onCopy }: CompactPromptCardProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 relative group",
        isSelected && "bg-muted border-primary"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-semibold text-sm truncate pr-16">{prompt.name}</h3>
        <p className="text-xs text-muted-foreground shrink-0">
          {formatDistanceToNow(new Date(prompt.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {prompt.text}
      </p>
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onCopy()}}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onClick()}}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function LocalLibraryViewContent({ setView }: { setView: (view: View) => void }) {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "prompt-forge-library",
    []
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const { toast } = useToast()
  const [isGeneratingName, startGeneratingName] = useTransition()

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


  // Select the first prompt by default if one exists
  useEffect(() => {
    if (!selectedPromptId && prompts.length > 0) {
      setSelectedPromptId(prompts[0].id)
    }
     if (selectedPromptId && !prompts.find(p => p.id === selectedPromptId)) {
        setSelectedPromptId(prompts.length > 0 ? prompts[0].id : null);
    }
  }, [prompts, selectedPromptId])

  const handleAddNewPrompt = () => {
    const newPrompt: Prompt = {
      id: `prompt_${Date.now()}`,
      name: "Untitled Prompt",
      text: "Start writing your new prompt here...",
      createdAt: new Date().toISOString(),
    }
    setPrompts((prev) => [newPrompt, ...prev])
    setSelectedPromptId(newPrompt.id)
  }
  
  const handleDeletePrompt = (idToDelete: string) => {
    setPrompts(prompts.filter((p) => p.id !== idToDelete));
    toast({
        title: "Prompt Deleted",
        description: "The prompt has been removed from your library.",
    });
  }

  const handlePromptUpdate = (promptId: string, newText: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, text: newText } : p))
    )
  }
  
  const handleNameUpdate = (promptId: string, newName: string) => {
     setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, name: newName } : p))
    )
  }

  const handleGenerateTitle = (prompt: Prompt) => {
    if (!prompt.text?.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Cannot generate a name for an empty prompt.",
        variant: "destructive"
      });
      return;
    }

    startGeneratingName(async () => {
      try {
        const { name } = await generatePromptName({
          prompt: prompt.text,
          apiKeys: getApiKeys(),
          modelName: settings.models.analysis
        });
        handleNameUpdate(prompt.id, name);
        toast({
          title: "Title Generated!",
          description: `New title is: "${name}"`,
        });
      } catch (error) {
        toast({
          title: "Failed to generate title",
          description: "Could not generate a title. Please check your API key and try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleCopyPrompt = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.text);
    toast({
      title: "Prompt Copied",
      description: `"${prompt.name}" has been copied to your clipboard.`,
    });
  };

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId)

  return (
    <main className="grid md:grid-cols-[340px_1fr] flex-1 overflow-y-auto">
      {/* Left Column: Prompt List */}
      <div className="flex flex-col gap-4 p-4 border-r bg-muted/20">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search your prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleAddNewPrompt} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 -mx-4">
            <div className="px-4 space-y-2 pb-4">
            {filteredPrompts.length > 0 ? (
                filteredPrompts.map((prompt) => (
                <CompactPromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isSelected={prompt.id === selectedPromptId}
                    onClick={() => setSelectedPromptId(prompt.id)}
                    onCopy={() => handleCopyPrompt(prompt)}
                />
                ))
            ) : (
                <div className="text-center text-sm text-muted-foreground pt-10">
                    <p>No prompts found.</p>
                    <p>Click the '+' to add a new one.</p>
                </div>
            )}
            </div>
        </ScrollArea>
      </div>

      {/* Right Column: Editor */}
      <div className="flex flex-col overflow-y-auto">
        {selectedPrompt ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Input 
                      value={selectedPrompt.name}
                      onChange={(e) => handleNameUpdate(selectedPrompt.id, e.target.value)}
                      className="text-lg font-bold h-auto p-0 border-none focus-visible:ring-0 shadow-none flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleGenerateTitle(selectedPrompt)} disabled={isGeneratingName}>
                    {isGeneratingName ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Title
                  </Button>
                </div>
              <p className="text-sm text-muted-foreground">
                Just start typing to edit your prompt.
              </p>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={selectedPrompt.text}
                onChange={(e) =>
                  handlePromptUpdate(selectedPrompt.id, e.target.value)
                }
                className="w-full h-full resize-none border-none focus-visible:ring-0 p-0"
                placeholder="Enter your prompt text here..."
              />
            </div>
             <div className="p-4 border-t mt-auto flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => handleDeletePrompt(selectedPrompt.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Prompt
                </Button>
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>Select a prompt to view or create a new one.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export function LocalLibraryView({ setView }: { setView: (view: View) => void }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">
            Prompt Library
          </h1>
          <p className="text-muted-foreground">
            Your personal collection of crafted prompts.
          </p>
        </div>
        {/* Placeholder for future actions like import/export */}
      </header>
      <ClientOnly>
        <LocalLibraryViewContent setView={setView} />
      </ClientOnly>
    </div>
  )
}
