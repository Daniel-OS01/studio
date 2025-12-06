"use client"

import {
  analyzeAndSuggestImprovements,
} from "@/ai/flows/analyze-and-suggest-improvements"
import { comparePromptVersions } from "@/ai/flows/compare-prompt-versions"
import { evaluatePromptQuality } from "@/ai/flows/evaluate-prompt-quality"
import {
  optimizePromptRecommendations,
} from "@/ai/flows/optimize-prompt-recommendations"
import { ClientOnly } from "@/components/shared/client-only"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type {
  AppSettings,
  Prompt,
  PromptAnalysis,
  PromptComparison,
  PromptRecommendations,
  PromptVersion,
  QualityMetrics,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  FileText,
  History,
  Lightbulb,
  Loader2,
  Save,
  Sparkles,
  TestTube2,
  ThumbsUp,
} from "lucide-react"
import React, { useState, useTransition } from "react"
import { ScoreGauge } from "../shared/score-gauge"

function HistoryTabContent() {
  const [history, setHistory] = useLocalStorage<PromptVersion[]>(
    "prompt-forge-history",
    []
  )
  const [selectedHistory, setSelectedHistory] = useState<number[]>([])
  const [comparison, setComparison] = useState<PromptComparison | null>(null)
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false)
  const [isComparing, startComparing] = useTransition()
  const { toast } = useToast()
  
  // This state is managed in the parent but we need it here for the restore button.
  // This is not ideal, but it's a quick fix for the demo.
  // A better solution would be to lift the state up or use a state manager.
  const [promptText, setPromptText] = useState("")


  const handleCompare = () => {
    if (selectedHistory.length !== 2) {
      toast({
        title: "Select two versions",
        description: "Please select exactly two prompt versions to compare.",
        variant: "destructive",
      })
      return
    }
    startComparing(async () => {
      setComparison(null)
      setIsComparisonDialogOpen(true)
      try {
        const result = await comparePromptVersions({
          promptVersion1: history[selectedHistory[1]].text,
          promptVersion2: history[selectedHistory[0]].text,
        })
        setComparison(result)
      } catch (error) {
        toast({
          title: "Comparison failed",
          description: "Could not compare the prompts. Please try again.",
          variant: "destructive",
        })
        console.error(error)
        setIsComparisonDialogOpen(false)
      }
    })
  }

  const handleHistoryCheckboxChange = (
    checked: boolean | string,
    index: number
  ) => {
    if (checked) {
      setSelectedHistory([...selectedHistory, index])
    } else {
      setSelectedHistory(selectedHistory.filter((i) => i !== index))
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <History />
          Prompt History
        </h3>
        <Button
          onClick={handleCompare}
          disabled={isComparing || selectedHistory.length !== 2}
          className="ml-auto"
        >
          {isComparing ? <Loader2 className="animate-spin" /> : <TestTube2 />}
          Compare ({selectedHistory.length})
        </Button>
      </div>
      <ScrollArea className="flex-1 border rounded-md p-2">
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((version, index) => (
              <div
                key={version.timestamp}
                className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50"
              >
                <Checkbox
                  id={`hist-${index}`}
                  onCheckedChange={(c) => handleHistoryCheckboxChange(c, index)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`hist-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <p className="truncate text-sm text-muted-foreground">
                      {version.text}
                    </p>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(version.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setPromptText(version.text)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">
            No history yet. Analyze or evaluate a prompt to save a version.
          </p>
        )}
      </ScrollArea>
      <Dialog
        open={isComparisonDialogOpen}
        onOpenChange={setIsComparisonDialogOpen}
      >
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Prompt Comparison</DialogTitle>
            <DialogDescription>
              AI-powered analysis of the differences between two prompt
              versions.
            </DialogDescription>
          </DialogHeader>
          {isComparing && !comparison ? (
            <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" /> Comparing prompts...
            </div>
          ) : comparison ? (
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">Version 1 (Older)</h4>
                <p className="text-muted-foreground p-2 bg-muted rounded-md max-h-20 overflow-auto">
                  {history[selectedHistory[1]]?.text}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Version 2 (Newer)</h4>
                <p className="text-muted-foreground p-2 bg-muted rounded-md max-h-20 overflow-auto">
                  {history[selectedHistory[0]]?.text}
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="text-accent" /> Analysis
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {comparison.analysis}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-destructive">
              <AlertTriangle />
              <p>Could not retrieve comparison.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function StudioView() {
  const [promptName, setPromptName] = useState("")
  const [promptText, setPromptText] = useState("")

  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [recommendations, setRecommendations] =
    useState<PromptRecommendations | null>(null)

  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "prompt-forge-settings",
    { apiKeys: [], activeApiKeyIndex: 0, models: { analysis: "gemini-2.5-flash", metrics: "gemini-2.5-flash", recommendations: "gemini-2.5-flash" } }
  )
  const [, setHistory] = useLocalStorage<PromptVersion[]>(
    "prompt-forge-history",
    []
  )
  const [, setLocalPrompts] = useLocalStorage<Prompt[]>(
    "prompt-forge-library",
    []
  )

  const [isAnalyzing, startAnalyzing] = useTransition()
  const [isEvaluating, startEvaluating] = useTransition()
  const [isRecommending, startRecommending] = useTransition()

  const { toast } = useToast()

  const getNextApiKey = () => {
    if (!settings.apiKeys || settings.apiKeys.length === 0) {
      return undefined;
    }
    const nextIndex = (settings.activeApiKeyIndex + 1) % settings.apiKeys.length;
    setSettings(prev => ({...prev, activeApiKeyIndex: nextIndex }));
    return settings.apiKeys[settings.activeApiKeyIndex]?.key;
  }

  const handleSaveToHistory = () => {
    if (!promptText.trim()) return
    const newVersion: PromptVersion = {
      text: promptText,
      timestamp: Date.now(),
    }
    setHistory((prev) => [newVersion, ...prev])
    toast({
      title: "Version saved",
      description: "Prompt version added to history.",
    })
  }

  const handleAnalyze = () => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt to analyze.",
        variant: "destructive",
      })
      return
    }
    startAnalyzing(async () => {
      setAnalysis(null)
      try {
        const apiKey = getNextApiKey();
        const result = await analyzeAndSuggestImprovements({ 
          prompt: promptText, 
          apiKey: apiKey,
          modelName: settings.models.analysis,
        })
        setAnalysis(result)
        handleSaveToHistory()
      } catch (error) {
        toast({
          title: "Analysis failed",
          description: "Could not analyze the prompt. Please try again.",
          variant: "destructive",
        })
        console.error(error)
      }
    })
  }

  const handleEvaluate = () => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt to evaluate.",
        variant: "destructive",
      })
      return
    }
    startEvaluating(async () => {
      setMetrics(null)
      try {
        const apiKey = getNextApiKey();
        const result = await evaluatePromptQuality(
          { prompt: promptText, apiKey: apiKey, modelName: settings.models.metrics }
        )
        setMetrics(result)
        handleSaveToHistory()
      } catch (error) {
        toast({
          title: "Evaluation failed",
          description: "Could not evaluate the prompt. Please try again.",
          variant: "destructive",
        })
        console.error(error)
      }
    })
  }

  const handleRecommend = () => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt to get recommendations.",
        variant: "destructive",
      })
      return
    }
    startRecommending(async () => {
      setRecommendations(null)
      try {
        const apiKey = getNextApiKey();
        const result = await optimizePromptRecommendations({
          promptText: promptText,
          apiKey: apiKey,
          modelName: settings.models.recommendations,
        })
        setRecommendations(result)
        handleSaveToHistory()
      } catch (error) {
        toast({
          title: "Failed to get recommendations",
          description: "Could not get recommendations. Please try again.",
          variant: "destructive",
        })
        console.error(error)
      }
    })
  }

  const handleSaveToLibrary = () => {
    if (!promptText.trim() || !promptName.trim()) {
      toast({
        title: "Missing details",
        description: "Please provide a name and text for the prompt.",
        variant: "destructive",
      })
      return
    }
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      name: promptName,
      text: promptText,
      createdAt: new Date().toISOString(),
    }
    setLocalPrompts((prev) => [newPrompt, ...prev])
    toast({
      title: "Prompt saved!",
      description: `"${promptName}" has been added to your local library.`,
    })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-foreground">
          Studio
        </h1>
        <p className="text-muted-foreground">
          Craft, analyze, and refine your AI prompts.
        </p>
      </header>
      <main className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left Panel: Editor */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prompt Editor</CardTitle>
            <CardDescription>
              Compose your prompt and use the tools to enhance it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div className="grid gap-2">
              <Label htmlFor="prompt-name">Prompt Name</Label>
              <Input
                id="prompt-name"
                placeholder="e.g., Creative Story Starter"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="prompt-text">Prompt</Label>
              <Textarea
                id="prompt-text"
                placeholder="Enter your prompt here..."
                className="h-full resize-none"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Analyze
              </Button>
              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                variant="secondary"
              >
                {isEvaluating ? <Loader2 className="animate-spin" /> : <TestTube2 />}
                Evaluate Quality
              </Button>
              <Button
                onClick={handleRecommend}
                disabled={isRecommending}
                variant="secondary"
              >
                {isRecommending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Lightbulb />
                )}
                Get Recommendations
              </Button>
              <Button
                onClick={handleSaveToLibrary}
                variant="outline"
                className="ml-auto"
              >
                <Save />
                Save to Library
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Tabs */}
        <Tabs defaultValue="analysis" className="flex flex-col">
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="flex-1 overflow-auto mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Prompt Analysis</CardTitle>
                <CardDescription>
                  AI-powered breakdown of your prompt's structure and potential.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" /> Analyzing...
                  </div>
                )}
                {analysis ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileText />
                        Analysis
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysis.analysis}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ThumbsUp />
                        Suggestions
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysis.suggestions}
                      </p>
                    </div>
                  </div>
                ) : (
                  !isAnalyzing && (
                    <p className="text-sm text-muted-foreground">
                      Run an analysis to see results.
                    </p>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 overflow-auto mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Quantitative feedback on your prompt's quality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEvaluating && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" /> Evaluating...
                  </div>
                )}
                {metrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-around flex-wrap gap-4">
                      <ScoreGauge score={metrics.clarity} label="Clarity" />
                      <ScoreGauge
                        score={metrics.specificity}
                        label="Specificity"
                      />
                      <ScoreGauge
                        score={metrics.potentialBias}
                        label="Bias"
                      />
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Lightbulb />
                        Suggestions
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {metrics.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  !isEvaluating && (
                    <p className="text-sm text-muted-foreground">
                      Run an evaluation to see results.
                    </p>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="recommendations"
            className="flex-1 overflow-auto mt-4"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>
                  Actionable tips to improve your prompt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isRecommending && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" /> Getting
                    recommendations...
                  </div>
                )}
                {recommendations ? (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {recommendations.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  !isRecommending && (
                    <p className="text-sm text-muted-foreground">
                      Click "Get Recommendations" to see results.
                    </p>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="history"
            className="flex-1 flex flex-col gap-4 mt-4"
          >
            <ClientOnly>
              <HistoryTabContent />
            </ClientOnly>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
