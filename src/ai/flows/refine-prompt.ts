'use server';
/**
 * @fileOverview A flow to generate a single, interactive refinement step for a given prompt.
 *
 * - refinePrompt - A function that generates one prompt refinement step.
 * - RefinePromptInput - The input type for the refinePrompt function.
 * - RefinePromptOutput - The return type for the refinePrompt function.
 */

import { ai } from '@/ai/genkit';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
  modelName: z.string().optional().describe('The model name to use.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinementOptionSchema = z.object({
  title: z.string().describe('The short text for the suggestion button.'),
  icon: z.string().optional().describe('A relevant emoji for the option.'),
  text: z
    .string()
    .describe(
      'The final, fully refined and optimized prompt text to be used if this combination of options is chosen.'
    ),
  example: z
    .string()
    .describe(
      'An example of how this option improves a sample prompt.'
    ),
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
  .max(6)
  .describe('An array of 3 to 6 refinement questions.');

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

  for (const key of keysToTry) {
    if (!key) continue;
    try {
      const localAi = genkit({
        plugins: [googleAI({ apiKey: key })],
      });

      const { output } = await localAi.generate({
        model: modelName ? googleAI.model(modelName) : ai.model,
        prompt: `You are an expert prompt engineer. Your task is to generate a set of diverse, actionable questions to refine a user's prompt based on their stated goals.

        The user's current prompt is:
        "${prompt}"
        
        The user's high-level refinement goals are: "${refinementGoal}"
        
        Based on this, you MUST generate a list of 3 to 6 different questions. Each question must be from a different perspective (e.g., one about tone, one about format, one about specificity, etc.).

        For each question in the list, you MUST provide:
        1. A clear 'title' for the question (e.g., "What kind of tone or mood should the short story have?").
        2. A brief 'explanation' of why this question is important for achieving the user's goal.
        3. A list of 3 to 6 diverse, actionable 'options' for that question.
        
        Each individual 'option' within a question MUST include:
        - A short 'title' for the option (e.g., "Epic/Heroic").
        - A relevant emoji 'icon' (e.g., "⚔️").
        - An 'example' showing how the suggestion improves a sample prompt.
        - The final, complete, optimized prompt 'text' that should be used if the user selects this option. This optimized prompt should be a complete reformulation of the original, incorporating the specific choice. It should be structured with sections like "Role:", "Task:", "Key Requirements:", and a final "Optimized Prompt:".

        Example for a single question object in the final array:
        {
          "title": "What kind of tone should the story have?",
          "explanation": "The tone significantly influences the narrative style and word choice.",
          "options": [
            { 
              "title": "Epic/Heroic", 
              "icon": "⚔️", 
              "text": "Role: You are a Master Storyteller specializing in Epic Fantasy.\\n\\nTask: Write a compelling short story about a dragon.\\n\\nKey Requirements:\\n1. Tone/Mood: The story must have an Epic and Heroic atmosphere.\\n\\nOptimized Prompt:\\nCraft a short story with an Epic and Heroic tone. The narrative must feature a dragon, detailing a legendary event or a moment of profound conflict.",
              "example": "For a story about a dragon, specifying an 'Epic/Heroic' tone focuses the AI on grand scale and valor."
            },
            { 
              "title": "Humorous/Lighthearted", 
              "icon": "😂", 
              "text": "Role: You are a Comedy Writer.\\n\\nTask: Write a funny short story about a dragon.\\n\\nKey Requirements:\\n1. Tone/Mood: The story must be humorous and lighthearted.\\n\\nOptimized Prompt:\\nWrite a humorous, lighthearted short story about a dragon who has an unusual problem, like hoarding rubber ducks instead of gold.",
              "example": "For a story about a dragon, a 'Humorous' tone shifts the focus to comedy and absurd situations."
            }
          ]
        }
        
        Now, generate the full array of 3 to 6 questions based on the user's prompt and goals.`,
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
