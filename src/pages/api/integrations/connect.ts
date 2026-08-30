import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { initiateConnection, isComposioConfigured, type GoogleProvider } from '@/lib/composio';
import { env } from '@/lib/env';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  const userId = locals.user?.id;
  if (!wsId || !userId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const { provider } = await request.json();
  if (!provider) return new Response(JSON.stringify({ error: 'No provider' }), { status: 400 });

  // For LLM providers, just mark as connected if API key exists
  if (['openai', 'anthropic', 'openrouter'].includes(provider)) {
    const hasKey = Boolean(env[`${provider.toUpperCase()}_API_KEY` as keyof typeof env]);
    if (!hasKey) return new Response(JSON.stringify({ error: 'API key not configured in .env' }), { status: 400 });

    const existing = await db.select().from(schema.integrations)
      .where(and(eq(schema.integrations.workspaceId, wsId), eq(schema.integrations.provider, provider as any))).limit(1);

    if (existing.length > 0) {
      await db.update(schema.integrations).set({ status: 'connected', updatedAt: new Date() }).where(eq(schema.integrations.id, existing[0].id));
    } else {
      await db.insert(schema.integrations).values({ workspaceId: wsId, provider: provider as any, status: 'connected' });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // For Google providers, use Composio
  if (!isComposioConfigured()) {
    return new Response(JSON.stringify({ error: 'Composio is not configured. Set COMPOSIO_API_KEY in .env.' }), { status: 400 });
  }

  try {
    const redirectUri = `${env.APP_URL}/api/integrations/oauth/callback`;
    const { redirectUrl, connectedAccountId } = await initiateConnection(provider as GoogleProvider, redirectUri, userId);

    // Mark as connecting
    const existing = await db.select().from(schema.integrations)
      .where(and(eq(schema.integrations.workspaceId, wsId), eq(schema.integrations.provider, provider as any))).limit(1);

    if (existing.length > 0) {
      await db.update(schema.integrations).set({ status: 'connecting', connectedAccountId, updatedAt: new Date() }).where(eq(schema.integrations.id, existing[0].id));
    } else {
      await db.insert(schema.integrations).values({ workspaceId: wsId, provider: provider as any, status: 'connecting', connectedAccountId });
    }

    return new Response(JSON.stringify({ redirectUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to initiate connection' }), { status: 500 });
  }
};
