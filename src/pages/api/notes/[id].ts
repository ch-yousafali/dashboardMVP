import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.notes).set({
    text: String(body.text || ''),
    pinned: Boolean(body.pinned),
    color: String(body.color || 'default'),
    updatedAt: new Date(),
  }).where(and(eq(schema.notes.id, params.id), eq(schema.notes.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  await db.delete(schema.notes).where(and(eq(schema.notes.id, params.id), eq(schema.notes.workspaceId, wsId)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.notes).set({
    pinned: Boolean(body.pinned),
    updatedAt: new Date(),
  }).where(and(eq(schema.notes.id, params.id), eq(schema.notes.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};
