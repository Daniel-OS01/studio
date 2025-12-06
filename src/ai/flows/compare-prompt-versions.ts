'use server';

/**
 * @fileOverview A flow to compare two different versions of a prompt and highlight the changes and their impact.
 *
 * - comparePromptVersions - A function that compares two prompt versions.
 * - ComparePromptVersionsInput - The input type for the comparePromptVersions function.
 * - ComparePromptVersionsOutput - The return type for the comparePromptVersions function.
 */

import {genkit} from 'genkit';
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

const comparePromptVersionsFlow = async ({promptVersion1, promptVersion2, apiKeys}: ComparePromptVersionsInput) => {
    const keysToTry = apiKeys?.length ? apiKeys : [process.env.GEMINI_API_KEY];
    
    for (const key of keysToTry) {
      if (!key) continue;
      try {
        // Create a new, isolated Genkit instance for each attempt
        const localAi = genkit({
            plugins: [googleAI({apiKey: key})],
        });

        const {output} = await localAi.generate({
          prompt: `You are an AI prompt expert. Compare the two prompt versions provided below and highlight the key differences and their potential impact on the AI's response.

Prompt Version 1:
${promptVersion1}

Prompt Version 2:
${promptVersion2}

Analysis:
`,
          model: googleAI.model('gemini-1.5-flash-latest'),
          output: {
            schema: ComparePromptVersionsOutputSchema,
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