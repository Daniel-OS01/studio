
"use client"

import { ClientOnly } from "@/components/shared/client-only"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useToast } from "@/hooks/use-toast"
import type { AppSettings } from "@/lib/types"
import { Key, Save } from "lucide-react"
import React, { useEffect, useState } from "react"

const availableModels = [
  "gemini-2.5-flash",
  "gemini-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
]

const customModelValue = "custom"

type ModelConfig = "analysis" | "metrics" | "recommendations"

function SettingsViewContent() {
  const [savedSettings, setSavedSettings] = useLocalStorage<AppSettings>(
    "prompt-forge-settings",
    {
      apiKey: "",
      models: {
        analysis: "gemini-2.5-flash",
        metrics: "gemini-2.5-flash",
        recommendations: "gemini-2.5-flash",
      },
    }
  )

  const [localSettings, setLocalSettings] = useState<AppSettings>(savedSettings)
  const { toast } = useToast()

  useEffect(() => {
    setLocalSettings(savedSettings)
  }, [savedSettings])

  const handleModelChange = (modelType: ModelConfig, value: string) => {
    const isCustom = value === customModelValue
    setLocalSettings((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [modelType]: isCustom ? "" : value,
      },
    }))
  }

  const handleCustomModelChange = (modelType: ModelConfig, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [modelType]: value,
      },
    }))
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings((prev) => ({
      ...prev,
      apiKey: e.target.value,
    }))
  }

  const handleSaveChanges = () => {
    setSavedSettings(localSettings)
    toast({
      title: "Settings Saved",
      description: "Your new settings have been applied.",
    })
  }

  const isCustomModel = (modelName: string) =>
    modelName !== "" && !availableModels.includes(modelName)

  return (
    <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Provide your own Google API Key to use for all AI features. This
            will override any default keys.
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
              value={localSettings.apiKey}
              onChange={handleApiKeyChange}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>
            Choose which Gemini model to use for each specific AI task, or
            provide a custom model name.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model-analysis">Analysis Model</Label>
              <Select
                value={
                  localSettings.models.analysis && !availableModels.includes(localSettings.models.analysis)
                    ? customModelValue
                    : localSettings.models.analysis
                }
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
                  <SelectItem value={customModelValue}>Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localSettings.models.analysis === "" || isCustomModel(localSettings.models.analysis) ? (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.analysis}
                onChange={(e) =>
                  handleCustomModelChange("analysis", e.target.value)
                }
              />
            ) : null}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model-metrics">Metrics Model</Label>
              <Select
                value={
                  localSettings.models.metrics && !availableModels.includes(localSettings.models.metrics)
                    ? customModelValue
                    : localSettings.models.metrics
                }
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
                  <SelectItem value={customModelValue}>Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localSettings.models.metrics === "" || isCustomModel(localSettings.models.metrics) ? (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.metrics}
                onChange={(e) =>
                  handleCustomModelChange("metrics", e.target.value)
                }
              />
            ) : null}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model-recommendations">
                Recommendations Model
              </Label>
              <Select
                value={
                  localSettings.models.recommendations && !availableModels.includes(localSettings.models.recommendations)
                    ? customModelValue
                    : localSettings.models.recommendations
                }
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
                  <SelectItem value={customModelValue}>Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localSettings.models.recommendations === "" || isCustomModel(localSettings.models.recommendations) ? (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.recommendations}
                onChange={(e) =>
                  handleCustomModelChange("recommendations", e.target.value)
                }
              />
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} className="ml-auto">
            <Save />
            Save Changes
          </Button>
        </CardFooter>
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
