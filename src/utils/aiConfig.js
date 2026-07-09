const DEFAULT_AI_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_AI_MODEL = 'openai/gpt-oss-120b';

export const AI_API_URL =
  import.meta.env.AI_API_URL ||
  DEFAULT_AI_API_URL;

export const AI_BEARER =
  import.meta.env.AI_BEARER ||
  '';

export const AI_MODEL =
  import.meta.env.AI_MODEL ||
  import.meta.env.AI_MODEL_OLD ||
  DEFAULT_AI_MODEL;
