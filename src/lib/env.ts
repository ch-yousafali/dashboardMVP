import 'dotenv/config';

/**
 * Server-side environment access.
 * Import `env` to get typed, validated environment variables.
 * Never expose secrets to the client.
 */

function getEnv(key: string, fallback = ''): string {
  const val = process.env[key] ?? fallback;
  return val;
}

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  AUTH_SECRET: getEnv('AUTH_SECRET'),
  APP_URL: getEnv('APP_URL', 'http://localhost:4321'),
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),
  ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY'),
  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY'),
  COMPOSIO_API_KEY: getEnv('COMPOSIO_API_KEY'),
  GOOGLE_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: getEnv('GOOGLE_REDIRECT_URI', 'http://localhost:4321/api/integrations/oauth/callback'),
} as const;

export type Env = typeof env;
