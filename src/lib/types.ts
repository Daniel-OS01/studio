import type {
  AnalyzeAndSuggestImprovementsOutput,
} from "@/ai/flows/analyze-and-suggest-improvements"
import type { ComparePromptVersionsOutput } from "@/ai/flows/compare-prompt-versions"
import type { EvaluatePromptQualityOutput } from "@/ai/flows/evaluate-prompt-quality"
import type { OptimizePromptRecommendationsOutput } from "@/ai/flows/optimize-prompt-recommendations"
import type { RefinePromptOutput } from "@/ai/flows/refine-prompt"


export type Prompt = {
  id: string
  name: string
  text: string
  createdAt: string
}

export type PromptVersion = {
  text: string
  timestamp: number
}

export type QualityMetrics = EvaluatePromptQualityOutput
export type PromptAnalysis = AnalyzeAndSuggestImprovementsOutput
export type PromptRecommendations = OptimizePromptRecommendationsOutput
export type PromptComparison = ComparePromptVersionsOutput

export type RefinementStep = RefinePromptOutput

export type View = "studio" | "local-library" | "community-library" | "settings"

export type ApiKey = {
  name: string
  key: string
}

export type AppSettings = {
  apiKeys: ApiKey[]
  activeApiKeyIndex: number
  lastModified?: string
  models: {
    analysis: string
    metrics: string
    recommendations: string
  }
}
