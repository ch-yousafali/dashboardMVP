import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.bulkOrders).values({
    workspaceId: wsId,
    supplier: String(body.supplier || ''),
    product: String(body.product || ''),
    quantity: Number(body.quantity) || 0,
    cost: Number(body.cost) || 0,
    date: String(body.date || todayISO()),
    status: (body.status as any) || 'Processing',
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Bulk order added', sub: `${item.product}, ${item.quantity} units`, date: todayISO() });
  await db.insert(schema.notifications).values({ workspaceId: wsId, title: 'New bulk order', text: item.product, time: 'Just now', section: 'bulk-orders', kind: 'bulk', read: false });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
