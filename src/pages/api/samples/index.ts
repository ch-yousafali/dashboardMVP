import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.samples).values({
    workspaceId: wsId,
    name: String(body.name || ''),
    product: String(body.product || ''),
    supplier: String(body.supplier || ''),
    status: (body.status as any) || 'Requested',
    submitted: String(body.submitted || todayISO()),
    expected: String(body.expected || ''),
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Sample added', sub: item.name, date: todayISO() });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
