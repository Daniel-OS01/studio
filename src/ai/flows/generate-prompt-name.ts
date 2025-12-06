'use server';

/**
 * @fileOverview Generates a concise and descriptive name for a given prompt text.
 *
 * - generatePromptName - A function that generates a name for a prompt.
 * - GeneratePromptNameInput - The input type for the generatePromptName function.
 * - GeneratePromptNameOutput - The return type for the generatePromptName function.
 */

import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const GeneratePromptNameInputSchema = z.object({
  prompt: z.string().describe('The prompt text to generate a name for.'),
  apiKeys: z
    .array(z.string())
    .optional()
    .describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
});
export type GeneratePromptNameInput = z.infer<
  typeof GeneratePromptNameInputSchema
>;

const GeneratePromptNameOutputSchema = z.object({
  name: z
    .string()
    .describe(
      'A concise, descriptive name for the prompt (4-5 words maximum).'
    ),
});
export type GeneratePromptNameOutput = z.infer<
  typeof GeneratePromptNameOutputSchema
>;

export async function generatePromptName(
  input: GeneratePromptNameInput
): Promise<GeneratePromptNameOutput> {
  return generatePromptNameFlow(input);
}

const generatePromptNameFlow = async ({
  prompt,
  apiKeys,
  modelName,
}: GeneratePromptNameInput) => {
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
        prompt: `You are an expert in summarizing content. Your task is to generate a short, descriptive name (4-5 words maximum) for the following prompt text. The name should capture the essence of the prompt's purpose.

Prompt: "${prompt}"

Generated Name:`,
        output: {
          schema: GeneratePromptNameOutputSchema,
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
