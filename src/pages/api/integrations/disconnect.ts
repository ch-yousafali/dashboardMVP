import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const { provider } = await request.json();
  if (!provider) return new Response(JSON.stringify({ error: 'No provider' }), { status: 400 });

  await db.update(schema.integrations)
    .set({ status: 'not_connected', connectedAccountId: null, updatedAt: new Date() })
    .where(and(eq(schema.integrations.workspaceId, wsId), eq(schema.integrations.provider, provider as any)));

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
