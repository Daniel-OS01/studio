import type { Prompt } from './types';

export const communityPrompts: Prompt[] = [
  {
    id: 'comm-1',
    name: 'Creative Story Starter',
    text: 'Write a short story beginning with the line, "The old lighthouse keeper found a message in a bottle, but the ink was written in a language he had never seen before...". The story should be mysterious and evoke a sense of ancient wonder.',
    createdAt: new Date('2023-10-26T10:00:00Z').toISOString(),
  },
  {
    id: 'comm-2',
    name: 'Technical Explainer',
    text: 'Explain the concept of "zero-knowledge proofs" to a non-technical audience. Use an analogy involving a hidden object in a box to illustrate the core idea. Avoid jargon as much as possible.',
    createdAt: new Date('2023-11-15T14:30:00Z').toISOString(),
  },
  {
    id: 'comm-3',
    name: 'Marketing Copy Generator',
    text: 'Generate three variations of marketing copy for a new productivity app called "Zenith". The app helps users organize their tasks using a minimalist interface. Target audience: busy professionals. Tone: inspiring and efficient.',
    createdAt: new Date('2024-01-05T09:00:00Z').toISOString(),
  },
  {
    id: 'comm-4',
    name: 'Code Refactoring Assistant',
    text: 'Act as a senior software engineer. I will provide a Python function. Your task is to refactor it for better readability, efficiency, and adherence to PEP 8 standards. Explain the changes you made and why.',
    createdAt: new Date('2024-02-20T18:00:00Z').toISOString(),
  },
  {
    id: 'comm-5',
    name: 'Fictional World Building',
    text: 'Describe a bustling marketplace in a steampunk city powered by geothermal energy. Focus on the sights, sounds, and smells. What unique gadgets or creatures might be for sale?',
    createdAt: new Date('2024-03-10T11:45:00Z').toISOString(),
  },
  {
    id: 'comm-6',
    name: 'Personalized Workout Plan',
    text: 'Create a 4-week beginner workout plan for someone who wants to build muscle and has access to basic dumbbells and resistance bands. The plan should include 3 workout days per week, focusing on full-body exercises. Include warm-up and cool-down suggestions.',
    createdAt: new Date('2024-04-01T07:00:00Z').toISOString(),
  },
];
