import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const { name } = await request.json();
  if (!name || !name.trim()) return new Response(JSON.stringify({ error: 'Name required' }), { status: 400 });

  const [workspace] = await db.insert(schema.workspaces).values({ name: String(name).trim(), ownerId: userId }).returning({ id: schema.workspaces.id });
  await db.insert(schema.members).values({ workspaceId: workspace.id, userId, role: 'owner' });

  return new Response(JSON.stringify({ workspaceId: workspace.id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
