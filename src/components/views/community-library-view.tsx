"use client"

import { PromptCard } from "@/components/shared/prompt-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { communityPrompts as allPrompts } from "@/lib/placeholder-data"
import type { Prompt, View } from "@/lib/types"
import React from "react"

interface CommunityLibraryViewProps {
  setView: (view: View) => void;
}

export function CommunityLibraryView({ setView }: CommunityLibraryViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const { toast } = useToast()

  const filteredPrompts = allPrompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUsePrompt = (prompt: Prompt) => {
    toast({
      title: "Prompt Copied (Demo)",
      description: `"${prompt.name}" is ready to be pasted in the Studio.`,
    })
    navigator.clipboard.writeText(prompt.text)
    setView("studio")
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-foreground">
          Community Library
        </h1>
        <p className="text-muted-foreground">
          Browse and adapt high-quality prompts from the community.
        </p>
      </header>
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        <Input
          placeholder="Search community prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="flex-1 overflow-y-auto pr-2">
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isCommunity
                  actions={
                    <Button size="sm" onClick={() => handleUsePrompt(prompt)}>
                      Copy & Use
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-lg font-semibold">No Prompts Found</h3>
              <p className="text-muted-foreground">
                Your search for "{searchTerm}" did not match any community prompts.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
