import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-and-suggest-improvements.ts';
import '@/ai/flows/optimize-prompt-recommendations.ts';
import '@/ai/flows/compare-prompt-versions.ts';
import '@/ai/flows/evaluate-prompt-quality.ts';