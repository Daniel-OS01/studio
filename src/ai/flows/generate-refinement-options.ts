'use server';
/**
 * @fileOverview A flow to generate high-level refinement goals for a prompt.
 *
 * - generateRefinementOptions - A function that generates refinement goals.
 * - GenerateRefinementOptionsInput - The input type for the function.
 * - GenerateRefinementOptionsOutput - The return type for the function.
 */

import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const GenerateRefinementOptionsInputSchema = z.object({
  prompt: z.string().describe('The initial prompt to refine.'),
  topic: z
    .string()
    .describe(
      'The high-level topic for refinement (e.g., "Primary Goal", "Audience", "Format").'
    ),
  // Include previous choices to provide context for the next level of suggestions.
  history: z
    .array(z.string())
    .optional()
    .describe('A list of previously selected refinement goals.'),
  apiKeys: z
    .array(z.string())
    .optional()
    .describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
});
export type GenerateRefinementOptionsInput = z.infer<
  typeof GenerateRefinementOptionsInputSchema
>;

const RefinementGoalSchema = z.object({
  title: z
    .string()
    .describe('A concise title for the refinement goal (e.g., "Increase output specificity").'),
  icon: z.string().optional().describe('An optional emoji or icon identifier.'),
});

const RefinementQuestionSchema = z.object({
  title: z
    .string()
    .describe('The question for this wizard step (e.g., "What is the primary goal?").'),
  icon: z.string().optional().describe('A relevant emoji for the question title.'),
  explanation: z.string().describe('A brief explanation of the step.'),
  options: z
    .array(RefinementGoalSchema)
    .min(3)
    .max(6)
    .describe('A list of 3 to 6 high-level refinement goals.'),
});

const GenerateRefinementOptionsOutputSchema = z
  .array(RefinementQuestionSchema)
  .min(2)
  .max(5)
  .describe('An array of 2 to 5 refinement questions.');

export type GenerateRefinementOptionsOutput = z.infer<
  typeof GenerateRefinementOptionsOutputSchema
>;

export async function generateRefinementOptions(
  input: GenerateRefinementOptionsInput
): Promise<GenerateRefinementOptionsOutput> {
  return generateRefinementOptionsFlow(input);
}

const generateRefinementOptionsFlow = async ({
  prompt,
  topic,
  history,
  apiKeys,
  modelName,
}: GenerateRefinementOptionsInput) => {
  const keysToTry = apiKeys?.length ? apiKeys : [process.env.GEMINI_API_KEY];
  const model = modelName ? googleAI.model(modelName) : 'googleai/gemini-2.5-flash';

  for (const key of keysToTry) {
    if (!key) continue;
    try {
      const localAi = genkit({
        plugins: [googleAI({ apiKey: key })],
      });

      const { output } = await localAi.generate({
        model: model,
        prompt: `You are an expert prompt engineer building an interactive wizard. Your task is to generate a set of questions for a wizard step.
        The user's prompt is: "${prompt}"
        The topic for this step is: "${topic}"
        ${
          history && history.length > 0
            ? `The user has already chosen: ${history.join(', ')}.`
            : ''
        }
        
        You MUST generate a list of 2 to 5 different questions related to the topic.
        For each question in the list, you MUST provide:
        1. A clear 'title' for the question (e.g., "What is the primary goal of your prompt?").
        2. A relevant 'icon' (emoji) for the question.
        3. A brief 'explanation' of why this question is important.
        4. A list of 3 to 6 diverse, high-level refinement goals ('options') for that question.
        
        Each individual 'option' within a question MUST include:
        - A short 'title' (e.g., "Increase output specificity").
        - A relevant 'icon' (emoji).
        
        Example for a single question object in the final array:
        {
          "title": "What is the primary goal of your prompt?",
          "icon": "🎯",
          "explanation": "Understanding the main objective helps tailor the suggestions.",
          "options": [
            { "title": "Increase output specificity", "icon": "🔍" },
            { "title": "Enhance creative variation", "icon": "🎨" },
            { "title": "Improve structural adherence", "icon": "🏗️" }
          ]
        }
        
        Generate the full array of 2 to 5 questions for the topic: "${topic}".`,
        output: {
          schema: GenerateRefinementOptionsOutputSchema,
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
