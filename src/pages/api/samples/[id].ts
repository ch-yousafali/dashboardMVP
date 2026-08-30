import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.samples).set({
    name: String(body.name || ''),
    product: String(body.product || ''),
    supplier: String(body.supplier || ''),
    status: (body.status as any) || 'Requested',
    submitted: String(body.submitted || ''),
    expected: String(body.expected || ''),
    updatedAt: new Date(),
  }).where(and(eq(schema.samples.id, params.id), eq(schema.samples.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  await db.delete(schema.samples).where(and(eq(schema.samples.id, params.id), eq(schema.samples.workspaceId, wsId)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
