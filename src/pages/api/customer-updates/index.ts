import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.customerUpdates).values({
    workspaceId: wsId,
    product: String(body.product || ''),
    subject: String(body.subject || ''),
    content: String(body.content || ''),
    state: (body.state as any) || 'Draft',
    date: todayISO(),
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Customer update created', sub: item.subject, date: todayISO() });
  await db.insert(schema.notifications).values({ workspaceId: wsId, title: 'New customer update', text: item.subject, time: 'Just now', section: 'customer-updates', kind: 'customer', read: false });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
