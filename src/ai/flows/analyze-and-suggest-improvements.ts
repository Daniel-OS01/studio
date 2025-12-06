'use server';

/**
 * @fileOverview Analyzes a prompt and suggests improvements.
 *
 * - analyzeAndSuggestImprovements - Analyzes a prompt and suggests improvements.
 * - AnalyzeAndSuggestImprovementsInput - The input type for the analyzeAndSuggestImprovements function.
 * - AnalyzeAndSuggestImprovementsOutput - The return type for the analyzeAndSuggestImprovements function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AnalyzeAndSuggestImprovementsInputSchema = z.object({
  prompt: z.string().describe('The prompt to analyze and improve.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
});
export type AnalyzeAndSuggestImprovementsInput = z.infer<
  typeof AnalyzeAndSuggestImprovementsInputSchema
>;

const AnalyzeAndSuggestImprovementsOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the prompt.'),
  suggestions: z.string().describe('Suggestions for improving the prompt.'),
});
export type AnalyzeAndSuggestImprovementsOutput = z.infer<
  typeof AnalyzeAndSuggestImprovementsOutputSchema
>;

export async function analyzeAndSuggestImprovements(
  input: AnalyzeAndSuggestImprovementsInput
): Promise<AnalyzeAndSuggestImprovementsOutput> {
  return analyzeAndSuggestImprovementsFlow(input);
}

const analyzeAndSuggestImprovementsFlow = async ({prompt: promptText, apiKeys}: AnalyzeAndSuggestImprovementsInput) => {
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
          prompt: `You are an AI prompt expert. Your job is to analyze the prompt provided and suggest improvements.

Prompt: ${promptText}

First, provide a detailed analysis of the prompt, including potential weaknesses.
Second, provide specific suggestions for improving the prompt to get better results from an AI model.
Be as detailed as possible.`,
          model: model,
          output: {
            schema: AnalyzeAndSuggestImprovementsOutputSchema,
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