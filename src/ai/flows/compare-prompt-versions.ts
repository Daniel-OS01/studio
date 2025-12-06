'use server';

/**
 * @fileOverview A flow to compare two different versions of a prompt and highlight the changes and their impact.
 *
 * - comparePromptVersions - A function that compares two prompt versions.
 * - ComparePromptVersionsInput - The input type for the comparePromptVersions function.
 * - ComparePromptVersionsOutput - The return type for the comparePromptVersions function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const ComparePromptVersionsInputSchema = z.object({
  promptVersion1: z.string().describe('The first version of the prompt.'),
  promptVersion2: z.string().describe('The second version of the prompt.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
});

export type ComparePromptVersionsInput = z.infer<typeof ComparePromptVersionsInputSchema>;

const ComparePromptVersionsOutputSchema = z.object({
  analysis: z.string().describe('An analysis of the differences between the two prompts and their potential impact.'),
});

export type ComparePromptVersionsOutput = z.infer<typeof ComparePromptVersionsOutputSchema>;

export async function comparePromptVersions(input: ComparePromptVersionsInput): Promise<ComparePromptVersionsOutput> {
  return comparePromptVersionsFlow(input);
}

const comparePromptVersionsFlow = ai.defineFlow(
  {
    name: 'comparePromptVersionsFlow',
    inputSchema: ComparePromptVersionsInputSchema,
    outputSchema: ComparePromptVersionsOutputSchema,
  },
  async ({promptVersion1, promptVersion2, apiKeys}) => {
    const keysToTry = apiKeys?.length ? apiKeys : [undefined];
    
    for (const key of keysToTry) {
      try {
        const plugins = key ? [googleAI({apiKey: key})] : [];
        const {output} = await ai.generate({
          prompt: `You are an AI prompt expert. Compare the two prompt versions provided below and highlight the key differences and their potential impact on the AI's response.

Prompt Version 1:
${promptVersion1}

Prompt Version 2:
${promptVersion2}

Analysis:
`,
          output: {
            schema: ComparePromptVersionsOutputSchema,
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
