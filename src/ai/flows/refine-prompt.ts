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
import { z } from 'zod';

const RefinePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to refine.'),
  refinementGoal: z
    .string()
    .describe(
      'A comma-separated list of user-selected goals for this refinement (e.g., "Increase specificity, Target a professional audience").'
    ),
  apiKeys: z
    .array(z.string())
    .optional()
    .describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinementOptionSchema = z.object({
  title: z.string().describe('The short text for the suggestion button.'),
  text: z
    .string()
    .describe('The text to be appended to the prompt if this option is chosen.'),
  example: z
    .string()
    .describe('An example of how this option improves a sample prompt.'),
});

const RefinementQuestionSchema = z.object({
  title: z
    .string()
    .describe('The question or title for this refinement step.'),
  explanation: z
    .string()
    .describe('A brief explanation of why this refinement is useful.'),
  options: z
    .array(RefinementOptionSchema)
    .min(3)
    .max(6)
    .describe(
      'A list of 3 to 6 interactive options for the user to choose from.'
    ),
});

const RefinePromptOutputSchema = z
  .array(RefinementQuestionSchema)
  .min(3)
  .max(5)
  .describe('An array of 3 to 5 refinement questions.');

export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(
  input: RefinePromptInput
): Promise<RefinePromptOutput> {
  return refinePromptFlow(input);
}

const refinePromptFlow = async ({
  prompt,
  refinementGoal,
  apiKeys,
  modelName,
}: RefinePromptInput) => {
  const keysToTry = apiKeys?.length ? apiKeys : [process.env.GEMINI_API_KEY];
  const model = modelName
    ? googleAI.model(modelName)
    : 'googleai/gemini-2.5-flash';

  for (const key of keysToTry) {
    if (!key) continue;
    try {
      const localAi = genkit({
        plugins: [googleAI({ apiKey: key })],
      });

      const { output } = await localAi.generate({
        model: model,
        prompt: `You are an expert prompt engineer. Your task is to generate a set of diverse, actionable questions to refine a user's prompt based on their stated goals.

        The user's current prompt is:
        "${prompt}"
        
        The user's high-level refinement goals are: "${refinementGoal}"
        
        Based on this, you MUST generate a list of 3 to 5 different questions. Each question must be from a different perspective (e.g., one about tone, one about format, one about specificity, etc.).

        For each question in the list, you MUST provide:
        1. A clear 'title' for the question (e.g., "How can we make the subject more specific?").
        2. A brief 'explanation' of why this question is important for achieving the user's goal.
        3. A list of 3 to 6 diverse, actionable 'options' for that question.
        
        Each individual 'option' within a question MUST include:
        - A short 'title' (for a button).
        - The 'text' that should be appended to the original prompt if chosen.
        - An 'example' showing how the suggestion improves a sample prompt, similar to pretty-prompt.com.
        
        Example for a single question object in the final array:
        {
          "title": "What kind of dragon is it?",
          "explanation": "Defining the dragon's nature will shape the story's conflict and character.",
          "options": [
            { "title": "A wise, ancient dragon", "text": "The story should feature a wise, ancient dragon.", "example": "For a story about a library, adding '...a wise, ancient dragon' as the librarian adds depth." },
            { "title": "A young, reckless dragon", "text": "The story should feature a young, reckless dragon.", "example": "For a story about a race, adding '...featuring a young, reckless dragon' raises the stakes." },
            { "title": "A metallic, clockwork dragon", "text": "The story should feature a metallic, clockwork dragon.", "example": "For a sci-fi story, adding '...a metallic, clockwork dragon' sets a steampunk tone." }
          ]
        }
        
        Now, generate the full array of 3 to 5 questions based on the user's prompt and goals.`,
        output: {
          schema: RefinePromptOutputSchema,
        },
      });
      if (!output) {
        throw new Error('No output from AI');
      }
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

    