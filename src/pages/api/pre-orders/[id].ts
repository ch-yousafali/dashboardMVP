import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.preOrders).set({
    product: String(body.product || ''),
    orders: Number(body.orders) || 0,
    status: (body.status as any) || 'Sourced',
    expected: String(body.expected || ''),
    shipping: String(body.shipping || ''),
    progress: Number(body.progress) || 0,
    updatedAt: new Date(),
  }).where(and(eq(schema.preOrders.id, params.id), eq(schema.preOrders.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  await db.delete(schema.preOrders).where(and(eq(schema.preOrders.id, params.id), eq(schema.preOrders.workspaceId, wsId)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
