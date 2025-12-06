'use server';
/**
 * @fileOverview A flow to generate a series of refinement suggestions for a given prompt.
 *
 * - refinePrompt - A function that generates prompt refinement steps.
 * - RefinePromptInput - The input type for the refinePrompt function.
 * - RefinePromptOutput - The return type for the refinePrompt function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const RefinePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to refine.'),
  apiKeys: z
    .array(z.string())
    .optional()
    .describe('An optional list of Google API keys to try.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinementOptionSchema = z.object({
  title: z.string().describe('The short text for the suggestion button.'),
  text: z
    .string()
    .describe('The text to be appended to the prompt if this option is chosen.'),
});

const RefinementStepSchema = z.object({
  title: z
    .string()
    .describe('The question or title for this refinement step.'),
  explanation: z
    .string()
    .describe('A brief explanation of why this refinement is useful.'),
  options: z
    .array(RefinementOptionSchema)
    .describe('A list of interactive options for the user to choose from.'),
});

const RefinePromptOutputSchema = z.object({
  refinementSteps: z
    .array(RefinementStepSchema)
    .max(3)
    .describe(
      'An array of up to 3 interactive refinement steps to improve the prompt.'
    ),
});

export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(
  input: RefinePromptInput
): Promise<RefinePromptOutput> {
  return refinePromptFlow(input);
}

const refinePromptFlow = async ({ prompt, apiKeys }: RefinePromptInput) => {
  const keysToTry = apiKeys?.length ? apiKeys : [undefined];
  const model = googleAI.model('gemini-2.5-flash');

  for (const key of keysToTry) {
    try {
      // Create a new, isolated Genkit instance for each attempt
      const localAi = genkit({
        plugins: key ? [googleAI({ apiKey: key })] : [googleAI()],
      });

      const { output } = await localAi.generate({
        prompt: `You are an expert prompt engineer. Your task is to analyze the user's prompt and generate a series of up to 3 interactive refinement questions to help them improve it. Each question should help clarify their intent and add important details.

        For each step, provide:
        1. A clear 'title' for the question (e.g., "What is the desired tone for the response?").
        2. A brief 'explanation' of why this question is important.
        3. A list of 4-5 'options', where each option has a 'title' (for a button) and the corresponding 'text' that should be appended to the original prompt.
        
        Example Input Prompt: "Write a short story."
        Example Output Step 1:
        {
          "title": "What genre should the story be?",
          "explanation": "Specifying a genre helps set the mood and style of the story.",
          "options": [
            { "title": "Mystery", "text": " The story should be a mystery." },
            { "title": "Science Fiction", "text": " The story should be science fiction." },
            { "title": "Fantasy", "text": " The story should be a fantasy." },
            { "title": "Horror", "text": " The story should be a horror." }
          ]
        }
        
        Analyze the following prompt and generate the refinement steps.
        
        Prompt:
        ${prompt}`,
        model: model,
        output: {
          schema: RefinePromptOutputSchema,
        },
      });
      return output;
    } catch (error: any) {
      const isRateLimitError =
        error.cause?.status === 429 || error.status === 429;
      if (isRateLimitError && keysToTry.indexOf(key) < keysToTry.length - 1) {
        console.log(
          `API key ending in ...${key?.slice(
            -4
          )} failed with rate limit. Trying next key.`
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('All API keys failed due to rate limiting or other errors.');
};
