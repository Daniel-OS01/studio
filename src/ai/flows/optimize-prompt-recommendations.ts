'use server';

/**
 * @fileOverview Provides personalized recommendations on how to improve prompts based on AI analysis.
 *
 * - optimizePromptRecommendations - A function that provides prompt optimization recommendations.
 * - OptimizePromptRecommendationsInput - The input type for the optimizePromptRecommendations function.
 * - OptimizePromptRecommendationsOutput - The return type for the optimizePromptRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const OptimizePromptRecommendationsInputSchema = z.object({
  promptText: z.string().describe('The prompt text to be optimized.'),
  apiKeys: z.array(z.string()).optional().describe('An optional list of Google API keys to try.'),
  modelName: z.string().optional().describe('An optional Gemini model name.'),
});

export type OptimizePromptRecommendationsInput = z.infer<typeof OptimizePromptRecommendationsInputSchema>;

const OptimizePromptRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.string().describe('A recommendation for improving the prompt.')
  ).describe('A list of recommendations for improving the prompt.'),
});

export type OptimizePromptRecommendationsOutput = z.infer<typeof OptimizePromptRecommendationsOutputSchema>;

export async function optimizePromptRecommendations(
  input: OptimizePromptRecommendationsInput
): Promise<OptimizePromptRecommendationsOutput> {
  return optimizePromptRecommendationsFlow(input);
}

const evaluateBestPracticeTool = ai.defineTool({
  name: 'evaluateBestPractice',
  description: 'Evaluates if a prompt follows the prompt engineering best practices.',
  inputSchema: z.object({
    prompt: z.string().describe('The prompt to evaluate.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
    // Implement your custom logic here to evaluate the prompt against best practices
    // and return a string indicating the evaluation result.  For example:
    return `The prompt seems ${input.prompt.length < 20 ? 'too short' : 'reasonable in length'}, the description is clear.`;
  }
);

const optimizePromptRecommendationsFlow = ai.defineFlow(
  {
    name: 'optimizePromptRecommendationsFlow',
    inputSchema: OptimizePromptRecommendationsInputSchema,
    outputSchema: OptimizePromptRecommendationsOutputSchema,
  },
  async ({promptText, apiKeys, modelName}) => {
    const keysToTry = apiKeys?.length ? apiKeys : [undefined];
    const model = modelName ? googleAI.model(modelName) : undefined;

    for (const key of keysToTry) {
        try {
            const plugins = key ? [googleAI({apiKey: key})] : [];
            const {output} = await ai.generate({
                prompt: `You are an AI prompt optimizer. Your job is to take a prompt and provide a list of recommendations on how to improve it. Use the evaluateBestPractice tool to evaluate the best practice.

Prompt: ${promptText}
Here are the recommendations:
`,
                model: model!,
                tools: [evaluateBestPracticeTool],
                output: {
                    schema: OptimizePromptRecommendationsOutputSchema,
                },
                plugins,
                safetySettings: [
                  {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_ONLY_HIGH',
                  },
                  {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE',
                  },
                  {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                  },
                  {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_LOW_AND_ABOVE',
                  },
                ],
            });
            return output;
        } catch (error: any) {
            if (error.status === 429 && keysToTry.indexOf(key) < keysToTry.length - 1) {
                console.log(`API key ${key?.slice(0,8)}... failed with rate limit. Trying next key.`);
                continue;
            }
            throw error;
        }
    }
    throw new Error("All API keys failed or no keys were provided.");
  }
);
