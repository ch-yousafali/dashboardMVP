import { env } from '@/lib/env';

/**
 * LLM abstraction — uses llmlite-style routing across OpenAI, Anthropic, OpenRouter.
 * Since llmlite is a Python library, this Node implementation provides the same
 * unified interface using the OpenAI-compatible API for OpenAI/OpenRouter and
 * the Anthropic SDK-compatible endpoint for Anthropic.
 */

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  openrouter: 'openai/gpt-4o-mini',
};

function getApiKey(provider: LLMProvider): string | null {
  switch (provider) {
    case 'openai':
      return env.OPENAI_API_KEY || null;
    case 'anthropic':
      return env.ANTHROPIC_API_KEY || null;
    case 'openrouter':
      return env.OPENROUTER_API_KEY || null;
  }
}

export function isProviderConfigured(provider: LLMProvider): boolean {
  return !!getApiKey(provider);
}

/**
 * Call an LLM provider. Uses the OpenAI-compatible chat completions API for
 * OpenAI and OpenRouter, and the Anthropic Messages API for Anthropic.
 */
export async function chat(
  messages: LLMMessage[],
  opts: { provider?: LLMProvider; model?: string; temperature?: number } = {},
): Promise<LLMResponse> {
  const provider = opts.provider ?? 'openai';
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`LLM provider "${provider}" is not configured. Set the API key in .env.`);
  }
  const model = opts.model ?? DEFAULT_MODELS[provider];

  if (provider === 'anthropic') {
    return chatAnthropic(apiKey, model, messages, opts.temperature ?? 0.7);
  }
  // OpenAI + OpenRouter share the same API shape
  const baseUrl = provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
  return chatOpenAICompatible(baseUrl, apiKey, model, messages, opts.temperature ?? 0.7, provider);
}

async function chatOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  temperature: number,
  provider: LLMProvider,
): Promise<LLMResponse> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? { 'HTTP-Referer': env.APP_URL, 'X-Title': 'Business HQ' } : {}),
    },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, provider };
}

async function chatAnthropic(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  temperature: number,
): Promise<LLMResponse> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const conv = messages.filter((m) => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature,
      system: system || undefined,
      messages: conv.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic request failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? '';
  return { text, provider: 'anthropic' };
}
