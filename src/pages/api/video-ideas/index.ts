import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });
  const body = await request.json();

  const [item] = await db.insert(schema.videoIdeas).values({
    workspaceId: wsId,
    title: String(body.title || ''),
    description: String(body.description || ''),
    status: (body.status as any) || 'Idea',
    priority: (body.priority as any) || 'Medium',
  }).returning();

  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Video idea added', sub: item.title, date: todayISO() });
  return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
