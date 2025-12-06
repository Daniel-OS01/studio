'use server';

/**
 * @fileOverview Analyzes a prompt and suggests improvements.
 *
 * - analyzeAndSuggestImprovements - Analyzes a prompt and suggests improvements.
 * - AnalyzeAndSuggestImprovementsInput - The input type for the analyzeAndSuggestImprovements function.
 * - AnalyzeAndSuggestImprovementsOutput - The return type for the analyzeAndSuggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AnalyzeAndSuggestImprovementsInputSchema = z.object({
  prompt: z.string().describe('The prompt to analyze and improve.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
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

const prompt = ai.definePrompt({
  name: 'analyzeAndSuggestImprovementsPrompt',
  input: {schema: z.object({prompt: z.string()})},
  output: {schema: AnalyzeAndSuggestImprovementsOutputSchema},
  prompt: `You are an AI prompt expert. Your job is to analyze the prompt provided and suggest improvements.

  Prompt: {{{prompt}}}

  First, provide a detailed analysis of the prompt, including potential weaknesses.
  Second, provide specific suggestions for improving the prompt to get better results from an AI model.
  Be as detailed as possible.`,
});

const analyzeAndSuggestImprovementsFlow = ai.defineFlow(
  {
    name: 'analyzeAndSuggestImprovementsFlow',
    inputSchema: AnalyzeAndSuggestImprovementsInputSchema,
    outputSchema: AnalyzeAndSuggestImprovementsOutputSchema,
  },
  async ({prompt: promptText, apiKeys, modelName}) => {
    const keysToTry = apiKeys?.length ? apiKeys : [undefined];
    const model = modelName ? googleAI.model(modelName) : undefined;
    
    for (const key of keysToTry) {
      try {
        const plugins = key ? [googleAI({apiKey: key})] : [];
        const {output} = await prompt({prompt: promptText}, {plugins, model});
        return output!;
      } catch (error: any) {
        if (error.status === 429 && keysToTry.indexOf(key) < keysToTry.length - 1) {
          console.log(`API key ${key?.slice(0, 8)}... failed. Trying next key.`);
          continue;
        }
        throw error;
      }
    }
    throw new Error("All API keys failed or no keys were provided.");
  }
);
