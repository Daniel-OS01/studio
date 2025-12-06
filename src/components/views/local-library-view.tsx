"use client"

import { PromptCard } from "@/components/shared/prompt-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Prompt, View } from "@/lib/types"
import { Download, Upload } from "lucide-react"
import React, { useRef } from "react"
import { ClientOnly } from "@/components/shared/client-only"

interface LocalLibraryViewProps {
  setView: (view: View) => void;
}

function LocalLibraryViewContent({ setView }: LocalLibraryViewProps) {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "prompt-forge-library",
    []
  )
  const [searchTerm, setSearchTerm] = React.useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUsePrompt = (prompt: Prompt) => {
    toast({
      title: "Prompt Loaded",
      description: `"${prompt.name}" is ready. Go to the Studio to use it. (This is a demo feature)`,
    });
    setView("studio");
  }

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id))
    toast({
      title: "Prompt Deleted",
      description: "The prompt has been removed from your library.",
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(prompts, null, 2)
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "prompt-forge-library.json"
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
    toast({
      title: "Exporting Library",
      description: "Your prompt library is being downloaded.",
    })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== "string") throw new Error("Invalid file content")
        const importedPrompts = JSON.parse(text) as Prompt[]

        if (
          !Array.isArray(importedPrompts) ||
          !importedPrompts.every((p) => p.id && p.name && p.text && p.createdAt)
        ) {
          throw new Error("Invalid prompt format")
        }

        const existingIds = new Set(prompts.map((p) => p.id))
        const newPrompts = importedPrompts.filter((p) => !existingIds.has(p.id))
        setPrompts([...prompts, ...newPrompts])
        toast({
          title: "Import Successful",
          description: `${newPrompts.length} new prompts added to your library.`,
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description:
            "The selected file is not a valid prompt library. Please check the file and try again.",
          variant: "destructive",
        })
        console.error("Import error:", error)
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>Manage Prompts</CardTitle>
                  <CardDescription>Search, import, or export your prompts.</CardDescription>
              </div>
               <div className="flex gap-2">
                  <Button onClick={handleImportClick} variant="outline">
                      <Upload /> Import
                  </Button>
                  <Button onClick={handleExport} disabled={prompts.length === 0}>
                      <Download /> Export
                  </Button>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                  />
              </div>
          </CardHeader>
          <CardContent>
               <Input
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </CardContent>
      </Card>

      <div className="flex-1 overflow-auto pr-2">
        {filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      Delete
                    </Button>
                    <Button size="sm" onClick={() => handleUsePrompt(prompt)}>
                      Use
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">Your Library is Empty</h3>
            <p className="text-muted-foreground max-w-sm">
              Go to the Studio to create and save your first prompt, or import an existing library.
            </p>
            <Button className="mt-4" onClick={() => setView("studio")}>Go to Studio</Button>
          </div>
        )}
      </div>
    </>
  )
}

export function LocalLibraryView({ setView }: LocalLibraryViewProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-foreground">
          My Library
        </h1>
        <p className="text-muted-foreground">
          Your personal collection of crafted prompts.
        </p>
      </header>
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <ClientOnly>
          <LocalLibraryViewContent setView={setView} />
        </ClientOnly>
      </main>
    </div>
  )
}
