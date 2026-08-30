import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  const { workspaceId } = await request.json();
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  }
  await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.workspaceId, workspaceId));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
