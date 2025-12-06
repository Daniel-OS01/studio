
import type {
  AnalyzeAndSuggestImprovementsOutput,
} from "@/ai/flows/analyze-and-suggest-improvements"
import type { ComparePromptVersionsOutput } from "@/ai/flows/compare-prompt-versions"
import type { EvaluatePromptQualityOutput } from "@/ai/flows/evaluate-prompt-quality"
import type { GeneratePromptNameOutput } from "@/ai/flows/generate-prompt-name"
import type { OptimizePromptRecommendationsOutput } from "@/ai/flows/optimize-prompt-recommendations"
import type { RefinePromptOutput as RefinePromptOutputFlow } from "@/ai/flows/refine-prompt"
import type { GenerateRefinementOptionsOutput as GenerateRefinementOptionsOutputFlow } from "@/ai/flows/generate-refinement-options"


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
export type PromptName = GeneratePromptNameOutput

export type RefinePromptOutput = RefinePromptOutputFlow

export type GenerateRefinementOptionsOutput = GenerateRefinementOptionsOutputFlow;


export type View = "studio" | "local-library" | "community-library" | "settings" | "refine";

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
    refine: string;
  }
}
