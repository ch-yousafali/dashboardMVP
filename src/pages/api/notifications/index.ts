import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspaceId') || locals.workspace?.id;
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  }

  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.workspaceId, workspaceId))
    .orderBy(schema.notifications.createdAt)
    .limit(50);

  return new Response(JSON.stringify({ notifications: rows.reverse() }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
