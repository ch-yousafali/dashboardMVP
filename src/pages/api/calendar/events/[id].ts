import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db
    .update(schema.calendarEvents)
    .set({
      title: String(body.title || ''),
      date: String(body.date || ''),
      time: String(body.time || ''),
      type: (body.type as 'meeting' | 'production' | 'deadline') || 'meeting',
      notes: String(body.notes || ''),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.calendarEvents.id, params.id), eq(schema.calendarEvents.workspaceId, wsId)))
    .returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ event: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });

  await db.delete(schema.calendarEvents)
    .where(and(eq(schema.calendarEvents.id, params.id), eq(schema.calendarEvents.workspaceId, wsId)));

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
