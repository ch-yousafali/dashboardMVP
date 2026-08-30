import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.videoIdeas).set({
    title: String(body.title || ''),
    description: String(body.description || ''),
    status: (body.status as any) || 'Idea',
    priority: (body.priority as any) || 'Medium',
    updatedAt: new Date(),
  }).where(and(eq(schema.videoIdeas.id, params.id), eq(schema.videoIdeas.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  await db.delete(schema.videoIdeas).where(and(eq(schema.videoIdeas.id, params.id), eq(schema.videoIdeas.workspaceId, wsId)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
