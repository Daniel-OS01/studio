'use server';

/**
 * @fileOverview Provides AI-driven metrics to evaluate prompt quality, including clarity, specificity, and potential for bias.
 *
 * - evaluatePromptQuality - A function that evaluates the quality of a prompt.
 * - EvaluatePromptQualityInput - The input type for the evaluatePromptQuality function.
 * - EvaluatePromptQualityOutput - The return type for the evaluatePromptQuality function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const EvaluatePromptQualityInputSchema = z.object({
  prompt: z.string().describe('The prompt to evaluate.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
});

export type EvaluatePromptQualityInput = z.infer<typeof EvaluatePromptQualityInputSchema>;

const EvaluatePromptQualityOutputSchema = z.object({
  clarity: z.number().describe('A score (0-10) indicating how clear the prompt is.'),
  specificity: z.number().describe('A score (0-10) indicating how specific the prompt is.'),
  potentialBias: z.number().describe('A score (0-10) indicating the potential for bias in the prompt.'),
  suggestions: z.array(z.string()).describe('Suggestions for improving the prompt.'),
});
export type EvaluatePromptQualityOutput = z.infer<typeof EvaluatePromptQualityOutputSchema>;

export async function evaluatePromptQuality(
  input: EvaluatePromptQualityInput
): Promise<EvaluatePromptQualityOutput> {
  return evaluatePromptQualityFlow(input);
}

const evaluatePromptQualityFlow = async ({prompt: promptText, apiKeys}: EvaluatePromptQualityInput) => {
    const keysToTry = apiKeys?.length ? apiKeys : [process.env.GEMINI_API_KEY];
    const model = googleAI.model('gemini-1.5-flash-latest');
    
    for (const key of keysToTry) {
      if (!key) continue;
      try {
        // Create a new, isolated Genkit instance for each attempt
        const localAi = genkit({
            plugins: [googleAI({apiKey: key})],
        });

        const {output} = await localAi.generate({
          prompt: `You are an AI prompt evaluator. You will evaluate the quality of a prompt based on clarity, specificity, and potential for bias.\n\nClarity: How easy is the prompt to understand? (0-10)\nSpecificity: How specific is the prompt? (0-10)\nPotential for Bias: How likely is the prompt to produce biased results? (0-10)\n\nProvide a score (0-10) for each of these categories, and provide suggestions for improving the prompt.\n\nPrompt: ${promptText}`,
          model: model,
          output: {
            schema: EvaluatePromptQualityOutputSchema,
          },
        });
        if (!output) throw new Error("No output from AI");
        return output;
      } catch (error: any) {
        const isRateLimitError = error.cause?.status === 429 || error.status === 429;
        if (isRateLimitError && keysToTry.indexOf(key) < keysToTry.length - 1) {
          console.log(`API key ending in ...${key?.slice(-4)} failed with rate limit. Trying next key.`);
          continue;
        }
        throw error;
      }
    }
    throw new Error("All API keys failed due to rate limiting or other errors.");
  }
;