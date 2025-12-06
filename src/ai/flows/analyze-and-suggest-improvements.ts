'use server';

/**
 * @fileOverview Analyzes a prompt and suggests improvements.
 *
 * - analyzeAndSuggestImprovements - Analyzes a prompt and suggests improvements.
 * - AnalyzeAndSuggestImprovementsInput - The input type for the analyzeAndSuggestImprovements function.
 * - AnalyzeAndSuggestImprovementsOutput - The return type for the analyzeAndSuggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAndSuggestImprovementsInputSchema = z.object({
  prompt: z.string().describe('The prompt to analyze and improve.'),
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
  input: {schema: AnalyzeAndSuggestImprovementsInputSchema},
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
