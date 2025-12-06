'use server';
/**
 * @fileOverview A flow to generate a single, interactive refinement step for a given prompt.
 *
 * - refinePrompt - A function that generates one prompt refinement step.
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
  example: z.string().describe('An example of how this option improves a sample prompt.')
});

const RefinePromptOutputSchema = z.object({
  title: z
    .string()
    .describe('The question or title for this refinement step.'),
  explanation: z
    .string()
    .describe('A brief explanation of why this refinement is useful.'),
  options: z
    .array(RefinementOptionSchema)
    .min(3)
    .max(5)
    .describe(
      'A list of 3-5 interactive options for the user to choose from.'
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
        prompt: `You are an expert prompt engineer. Your task is to analyze the user's prompt and generate a *single* interactive refinement step to help them improve it. The question should help clarify their intent and add important details from a specific perspective (e.g., audience, format, tone, detail). Your suggestions must balance detail and conciseness.

        For this single step, provide:
        1. A clear 'title' for the question (e.g., "Who is the target audience?").
        2. A brief 'explanation' of why this question is important for improving the prompt.
        3. A list of 3-5 diverse 'options'.
        
        Each option MUST include:
        - A 'title' (for a button).
        - The 'text' that should be appended to the original prompt if chosen.
        - An 'example' showing how the suggestion improves a sample prompt, like on pretty-prompt.com.

        Example Input Prompt: "Write a short story about a dragon."
        Example Output:
        {
          "title": "What kind of dragon is it?",
          "explanation": "Defining the dragon's nature will shape the story's conflict and character.",
          "options": [
            { "title": "A wise, ancient dragon", "text": " The story should feature a wise, ancient dragon.", "example": "For a story about a library, adding '...a wise, ancient dragon' as the librarian adds depth." },
            { "title": "A young, reckless dragon", "text": " The story should feature a young, reckless dragon.", "example": "For a story about a race, adding '...featuring a young, reckless dragon' raises the stakes." },
            { "title": "A misunderstood, gentle dragon", "text": " The story should feature a misunderstood, gentle dragon.", "example": "For a story about a village festival, adding '...where a misunderstood, gentle dragon lives nearby' creates intrigue." },
            { "title": "A greedy, treasure-hoarding dragon", "text": " The story should feature a greedy, treasure-hoarding dragon.", "example": "For a story about a quest, adding '...to retrieve a stolen artifact from a greedy, treasure-hoarding dragon' sets a clear goal." }
          ]
        }
        
        Analyze the following prompt and generate ONE refinement step. The suggestions should build on the prompt given. Do not generate an array of steps.
        
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
