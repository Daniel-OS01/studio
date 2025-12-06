
"use client"

import { ClientOnly } from "@/components/shared/client-only"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { AppSettings } from "@/lib/types"
import { Key } from "lucide-react"

const availableModels = [
  "gemini-2.5-flash",
  "gemini-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
]

type ModelConfig = "analysis" | "metrics" | "recommendations"

function SettingsViewContent() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "prompt-forge-settings",
    { apiKey: "", models: { analysis: "gemini-2.5-flash", metrics: "gemini-2.5-flash", recommendations: "gemini-2.5-flash" } }
  )

  const handleModelChange = (modelType: ModelConfig, value: string) => {
    setSettings((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [modelType]: value,
      },
    }))
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({
      ...prev,
      apiKey: e.target.value,
    }))
  }

  return (
    <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Provide your own Google API Key to use for all AI features. This will
            override any default keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-w-lg">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Google API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Google API Key"
              value={settings.apiKey}
              onChange={handleApiKeyChange}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>
            Choose which Gemini model to use for each specific AI task.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="model-analysis">Analysis Model</Label>
            <Select
              value={settings.models.analysis}
              onValueChange={(value) => handleModelChange("analysis", value)}
            >
              <SelectTrigger id="model-analysis">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model-metrics">Metrics Model</Label>
            <Select
              value={settings.models.metrics}
              onValueChange={(value) => handleModelChange("metrics", value)}
            >
              <SelectTrigger id="model-metrics">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model-recommendations">Recommendations Model</Label>
            <Select
              value={settings.models.recommendations}
              onValueChange={(value) =>
                handleModelChange("recommendations", value)
              }
            >
              <SelectTrigger id="model-recommendations">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}


export function SettingsView() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your API keys and model preferences.
        </p>
      </header>
      <ClientOnly>
        <SettingsViewContent />
      </ClientOnly>
    </div>
  )
}
