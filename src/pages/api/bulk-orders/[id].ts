import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [updated] = await db.update(schema.bulkOrders).set({
    supplier: String(body.supplier || ''),
    product: String(body.product || ''),
    quantity: Number(body.quantity) || 0,
    cost: Number(body.cost) || 0,
    date: String(body.date || ''),
    status: (body.status as any) || 'Processing',
  }).where(and(eq(schema.bulkOrders.id, params.id), eq(schema.bulkOrders.workspaceId, wsId))).returning();

  if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ item: updated }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  await db.delete(schema.bulkOrders).where(and(eq(schema.bulkOrders.id, params.id), eq(schema.bulkOrders.workspaceId, wsId)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
