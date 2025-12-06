'use server';

/**
 * @fileOverview A flow to compare two different versions of a prompt and highlight the changes and their impact.
 *
 * - comparePromptVersions - A function that compares two prompt versions.
 * - ComparePromptVersionsInput - The input type for the comparePromptVersions function.
 * - ComparePromptVersionsOutput - The return type for the comparePromptVersions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComparePromptVersionsInputSchema = z.object({
  promptVersion1: z.string().describe('The first version of the prompt.'),
  promptVersion2: z.string().describe('The second version of the prompt.'),
});

export type ComparePromptVersionsInput = z.infer<typeof ComparePromptVersionsInputSchema>;

const ComparePromptVersionsOutputSchema = z.object({
  analysis: z.string().describe('An analysis of the differences between the two prompts and their potential impact.'),
});

export type ComparePromptVersionsOutput = z.infer<typeof ComparePromptVersionsOutputSchema>;

export async function comparePromptVersions(input: ComparePromptVersionsInput): Promise<ComparePromptVersionsOutput> {
  return comparePromptVersionsFlow(input);
}

const comparePromptVersionsPrompt = ai.definePrompt({
  name: 'comparePromptVersionsPrompt',
  input: {schema: ComparePromptVersionsInputSchema},
  output: {schema: ComparePromptVersionsOutputSchema},
  prompt: `You are an AI prompt expert. Compare the two prompt versions provided below and highlight the key differences and their potential impact on the AI's response.

Prompt Version 1:
{{promptVersion1}}

Prompt Version 2:
{{promptVersion2}}

Analysis:
`,  
});

const comparePromptVersionsFlow = ai.defineFlow(
  {
    name: 'comparePromptVersionsFlow',
    inputSchema: ComparePromptVersionsInputSchema,
    outputSchema: ComparePromptVersionsOutputSchema,
  },
  async input => {
    const {output} = await comparePromptVersionsPrompt(input);
    return output!;
  }
);
