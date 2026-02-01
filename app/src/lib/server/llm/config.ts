import { env } from '$env/dynamic/private';

const truthy = new Set(['1', 'true', 'yes', 'on']);

export const mockEnabled = truthy.has(String(env.MOCK_LLM || '').toLowerCase());
export const modelBot = env.OPENAI_MODEL_BOT || 'gpt-4o-mini';
export const modelAligner = env.OPENAI_MODEL_ALIGNER || 'gpt-5.2-nano';

export const hasOpenAIKey = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim());
