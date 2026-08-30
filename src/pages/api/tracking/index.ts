import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.tracking).values({
    workspaceId: wsId,
    number: String(body.number || ''),
    carrier: (body.carrier as any) || 'UPS',
    product: String(body.product || ''),
    status: (body.status as any) || 'Pending',
    eta: String(body.eta || ''),
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Tracking added', sub: item.product, date: todayISO() });
  await db.insert(schema.notifications).values({ workspaceId: wsId, title: 'New tracking number', text: item.product, time: 'Just now', section: 'tracking', kind: 'tracking', read: false });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
