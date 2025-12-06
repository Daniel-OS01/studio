

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import type { AppSettings, ApiKey } from "@/lib/types"
import { Key, Plus, Save, Trash2, Info } from "lucide-react"
import React, { useEffect, useState } from "react"
import { format } from "date-fns"

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
      apiKeys: [],
      activeApiKeyIndex: 0,
      models: {
        analysis: "gemini-2.5-flash",
        metrics: "gemini-2.5-flash",
        recommendations: "gemini-2.5-flash",
      },
    }
  )

  const [localSettings, setLocalSettings] = useState<AppSettings>(savedSettings)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyValue, setNewKeyValue] = useState("")
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

  const handleAddNewKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast({
        title: "Missing Details",
        description: "Please provide both a name and a value for the API key.",
        variant: "destructive",
      })
      return
    }
    setLocalSettings(prev => ({
        ...prev,
        apiKeys: [...(prev.apiKeys || []), { name: newKeyName, key: newKeyValue }]
    }));
    setNewKeyName("");
    setNewKeyValue("");
  }
  
  const handleDeleteKey = (index: number) => {
      setLocalSettings(prev => ({
          ...prev,
          apiKeys: (prev.apiKeys || []).filter((_, i) => i !== index),
          activeApiKeyIndex: prev.activeApiKeyIndex >= index ? Math.max(0, prev.activeApiKeyIndex -1) : prev.activeApiKeyIndex
      }));
  }

  const handleSaveChanges = () => {
    const newSettings = { ...localSettings, lastModified: new Date().toISOString() };
    setSavedSettings(newSettings)
    toast({
      title: "Settings Saved",
      description: "Your new settings have been applied.",
    })
  }

  const isCustomModel = (modelName: string) =>
    modelName !== "" && !availableModels.includes(modelName)

  const currentKey = (localSettings.apiKeys || [])[localSettings.activeApiKeyIndex];

  return (
    <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>
            Add and manage multiple Google API keys. Select one to be active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={localSettings.activeApiKeyIndex?.toString() ?? "0"}
            onValueChange={(value) => setLocalSettings(prev => ({ ...prev, activeApiKeyIndex: parseInt(value, 10)}))}
            className="space-y-2"
          >
            {(localSettings.apiKeys || []).map((apiKey, index) => (
              <Label key={index} htmlFor={`key-${index}`} className="flex items-center gap-4 p-2 rounded-md bg-muted has-[:checked]:bg-accent has-[:checked]:text-accent-foreground cursor-pointer">
                <RadioGroupItem value={index.toString()} id={`key-${index}`} />
                <Key />
                <div className="flex-1">
                  <p className="font-semibold">{apiKey.name}</p>
                  <p className="text-sm opacity-70 truncate">{`**********${apiKey.key.slice(-4)}`}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleDeleteKey(index)}}>
                  <Trash2 className="text-destructive"/>
                </Button>
              </Label>
            ))}
          </RadioGroup>
          <div className="flex items-end gap-2 pt-4">
            <div className="grid gap-1.5 flex-1">
              <Label htmlFor="new-key-name">Key Name</Label>
              <Input id="new-key-name" placeholder="e.g., Personal Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            </div>
            <div className="grid gap-1.5 flex-1">
              <Label htmlFor="new-key-value">Key Value</Label>
              <Input id="new-key-value" type="password" placeholder="Enter Google API Key" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)}/>
            </div>
            <Button onClick={handleAddNewKey}><Plus /> Add Key</Button>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Usage Status</CardTitle>
          <CardDescription>
            Information about your current settings configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <Info className="text-muted-foreground"/>
                <div>
                    <p className="font-semibold">Last Modified</p>
                    <p className="text-muted-foreground">{savedSettings.lastModified ? format(new Date(savedSettings.lastModified), "PPP p") : 'Not saved yet'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <Key className="text-muted-foreground"/>
                <div>
                    <p className="font-semibold">Current API Key in Use</p>
                    <p className="text-muted-foreground">{currentKey ? `${currentKey.name} (**********${currentKey.key.slice(-4)})` : 'No active key'}</p>
                </div>
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
            {(localSettings.models.analysis === "" || isCustomModel(localSettings.models.analysis)) && (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.analysis}
                onChange={(e) =>
                  handleCustomModelChange("analysis", e.target.value)
                }
              />
            )}
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
            {(localSettings.models.metrics === "" || isCustomModel(localSettings.models.metrics)) && (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.metrics}
                onChange={(e) =>
                  handleCustomModelChange("metrics", e.target.value)
                }
              />
            )}
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
            {(localSettings.models.recommendations === "" || isCustomModel(localSettings.models.recommendations)) && (
              <Input
                placeholder="Enter custom model name"
                value={localSettings.models.recommendations}
                onChange={(e) =>
                  handleCustomModelChange("recommendations", e.target.value)
                }
              />
            )}
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
