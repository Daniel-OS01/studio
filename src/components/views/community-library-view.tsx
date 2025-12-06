
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { communityPrompts as allPrompts } from "@/lib/placeholder-data"
import type { Prompt, View } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Copy, Search } from "lucide-react"
import React, { useEffect, useState } from "react"

interface CompactPromptCardProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
}

function CompactPromptCard({
  prompt,
  isSelected,
  onClick,
}: CompactPromptCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer hover:bg-muted/50",
        isSelected && "bg-muted border-primary"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-sm truncate pr-2">{prompt.name}</h3>
        <p className="text-xs text-muted-foreground shrink-0">
          {formatDistanceToNow(new Date(prompt.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {prompt.text}
      </p>
    </div>
  )
}

export function CommunityLibraryView({
  setView,
}: {
  setView: (view: View) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredPrompts = allPrompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Select the first prompt by default
  useEffect(() => {
    if (filteredPrompts.length > 0) {
      setSelectedPromptId(filteredPrompts[0].id)
    } else {
        setSelectedPromptId(null);
    }
  }, [searchTerm])


  const handleUsePrompt = (prompt: Prompt) => {
    toast({
      title: "Prompt Copied!",
      description: `"${prompt.name}" copied to clipboard.`,
    })
    navigator.clipboard.writeText(prompt.text)
  }

  const selectedPrompt = allPrompts.find((p) => p.id === selectedPromptId)

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
      <main className="grid md:grid-cols-[340px_1fr] flex-1 overflow-hidden">
        {/* Left Column */}
        <div className="flex flex-col gap-4 p-4 border-r bg-muted/20 md:border-r">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search community prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                  />
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground pt-10">
                  <p>No prompts found for "{searchTerm}".</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column */}
        <div className="flex flex-col overflow-y-auto">
          {selectedPrompt ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">{selectedPrompt.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Read-only view. Copy the prompt to use it in the studio.
                  </p>
                </div>
                <Button onClick={() => handleUsePrompt(selectedPrompt)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy & Use
                </Button>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  value={selectedPrompt.text}
                  readOnly
                  className="w-full h-full resize-none border-none focus-visible:ring-0 p-0 bg-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <p>Select a prompt to view.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

    