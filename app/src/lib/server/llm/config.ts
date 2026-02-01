import { env } from '$env/dynamic/private';

export const modelBot = env.OPENAI_MODEL_BOT || 'gpt-5-nano';
export const modelAligner = env.OPENAI_MODEL_ALIGNER || 'gpt-5-nano';
