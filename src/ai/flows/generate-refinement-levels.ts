'use server';
/**
 * @fileOverview A flow to generate three distinct, cumulative levels of prompt refinement suggestions.
 *
 * - generateRefinementLevels - A function that generates three levels of suggestions.
 * - GenerateRefinementLevelsInput - The input type for the function.
 * - GenerateRefinementLevelsOutput - The return type for the function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateRefinementLevelsInputSchema = z.object({
  prompt: z.string().describe('The initial prompt to refine.'),
  apiKeys: z
    .array(z.string())
    .optional()
    .describe('An optional list of Google API keys to try.'),
});
export type GenerateRefinementLevelsInput = z.infer<
  typeof GenerateRefinementLevelsInputSchema
>;

const RefinementOptionSchema = z.object({
  title: z.string().describe('A concise title summarizing the proposed change.'),
  explanation: z
    .string()
    .describe('A detailed explanation justifying the modification and its expected impact on the output.'),
  example: z
    .string()
    .describe('An example illustrating the suggested modification, mimicking the style of pretty-prompt.com.'),
  text: z
    .string()
    .describe('The text to be appended to the prompt if this option is chosen.'),
});

const RefinementLevelSchema = z.object({
  levelTitle: z.string().describe('The title for this refinement level (e.g., "Level 1: Define the Audience").'),
  levelExplanation: z.string().describe('A brief explanation of this level\'s focus.'),
  options: z
    .array(RefinementOptionSchema)
    .min(3)
    .max(5)
    .describe('A list of 3-5 distinct suggestions for this level.'),
});

const GenerateRefinementLevelsOutputSchema = z.object({
  levels: z.array(RefinementLevelSchema).length(3).describe('An array of exactly three refinement levels.'),
});
export type GenerateRefinementLevelsOutput = z.infer<
  typeof GenerateRefinementLevelsOutputSchema
>;

export async function generateRefinementLevels(
  input: GenerateRefinementLevelsInput
): Promise<GenerateRefinementLevelsOutput> {
  return generateRefinementLevelsFlow(input);
}

const generateRefinementLevelsFlow = async ({ prompt, apiKeys }: GenerateRefinementLevelsInput) => {
  const keysToTry = apiKeys?.length ? apiKeys : [undefined];
  const model = googleAI.model('gemini-2.5-flash');

  for (const key of keysToTry) {
    try {
      const localAi = genkit({
        plugins: key ? [googleAI({ apiKey: key })] : [googleAI()],
      });

      const { output } = await localAi.generate({
        prompt: `You are an expert prompt engineer. Your task is to generate a 3-level interactive wizard to help a user refine their prompt. Each level must build upon the last, progressively adding detail and clarity.

        The user's initial prompt is:
        "${prompt}"
        
        Generate an array of exactly 3 refinement levels.
        
        For EACH of the 3 levels, you must provide:
        1. A 'levelTitle' for the step (e.g., "Level 1: Clarify the Core Subject," "Level 2: Define the Output Format," "Level 3: Set the Tone and Constraints").
        2. A 'levelExplanation' of what this level aims to achieve.
        3. An array of 3 to 5 diverse 'options'. The suggestions at each level must come from different analytical perspectives (e.g., for Level 1, one option for audience, one for subject detail, one for primary goal).
        
        Each individual 'option' MUST include:
        - A 'title': A short, clear summary for a button.
        - An 'explanation': Justify why this change is valuable.
        - An 'example': Show how this suggestion improves a generic prompt. For instance, "For a story about a dragon, adding '...who is misunderstood' creates instant conflict and character depth."
        - The 'text' to append to the prompt.
        
        CRITICAL: The goal is to balance detail and conciseness. Suggestions should make the prompt more effective without making it overly verbose. The levels must be cumulative in nature.`,
        model: model,
        output: {
          schema: GenerateRefinementLevelsOutputSchema,
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
