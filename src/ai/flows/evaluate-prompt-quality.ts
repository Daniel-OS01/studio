'use server';

/**
 * @fileOverview Provides AI-driven metrics to evaluate prompt quality, including clarity, specificity, and potential for bias.
 *
 * - evaluatePromptQuality - A function that evaluates the quality of a prompt.
 * - EvaluatePromptQualityInput - The input type for the evaluatePromptQuality function.
 * - EvaluatePromptQualityOutput - The return type for the evaluatePromptQuality function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const EvaluatePromptQualityInputSchema = z.object({
  prompt: z.string().describe('The prompt to evaluate.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
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

const evaluatePromptQualityFlow = ai.defineFlow(
  {
    name: 'evaluatePromptQualityFlow',
    inputSchema: EvaluatePromptQualityInputSchema,
    outputSchema: EvaluatePromptQualityOutputSchema,
  },
  async ({prompt: promptText, apiKeys, modelName}) => {
    const keysToTry = apiKeys?.length ? apiKeys : [undefined];
    const model = modelName ? googleAI.model(modelName) : undefined;
    
    for (const key of keysToTry) {
      try {
        const plugins = key ? [googleAI({apiKey: key})] : [];
        const {output} = await ai.generate({
          prompt: `You are an AI prompt evaluator. You will evaluate the quality of a prompt based on clarity, specificity, and potential for bias.\n\nClarity: How easy is the prompt to understand? (0-10)\nSpecificity: How specific is the prompt? (0-10)\nPotential for Bias: How likely is the prompt to produce biased results? (0-10)\n\nProvide a score (0-10) for each of these categories, and provide suggestions for improving the prompt.\n\nPrompt: ${promptText}`,
          model: model!,
          output: {
            schema: EvaluatePromptQualityOutputSchema,
          },
          plugins,
        });
        return output;
      } catch (error: any) {
        if (error.status === 429 && keysToTry.indexOf(key) < keysToTry.length - 1) {
          console.log(`API key ${key?.slice(0, 8)}... failed with rate limit. Trying next key.`);
          continue;
        }
        throw error;
      }
    }
    throw new Error("All API keys failed or no keys were provided.");
  }
);
