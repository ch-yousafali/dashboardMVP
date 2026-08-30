import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.notes).values({
    workspaceId: wsId,
    text: String(body.text || ''),
    pinned: Boolean(body.pinned) || false,
    color: String(body.color || 'default'),
    date: todayISO(),
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Note added', sub: item.text.slice(0, 50), date: todayISO() });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
