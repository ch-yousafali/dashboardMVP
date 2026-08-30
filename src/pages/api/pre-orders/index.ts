import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.preOrders).values({
    workspaceId: wsId,
    product: String(body.product || ''),
    orders: Number(body.orders) || 0,
    status: (body.status as any) || 'Sourced',
    expected: String(body.expected || ''),
    shipping: String(body.shipping || ''),
    progress: Number(body.progress) || 0,
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Pre-order added', sub: item.product, date: todayISO() });
  await db.insert(schema.notifications).values({ workspaceId: wsId, title: 'New pre-order', text: item.product, time: 'Just now', section: 'pre-orders', kind: 'order', read: false });

  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
