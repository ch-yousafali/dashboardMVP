import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  const userId = locals.user?.id;
  if (!wsId || !userId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const body = await request.json();

  // Update workspace name
  if (body.businessName) {
    await db.update(schema.workspaces).set({ name: String(body.businessName), updatedAt: new Date() }).where(eq(schema.workspaces.id, wsId));
  }

  // Update profile
  if (body.ownerName) {
    const existing = await db.select({ id: schema.profiles.id }).from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(schema.profiles).set({ fullName: String(body.ownerName), avatarInitials: String(body.ownerName).slice(0, 2).toUpperCase(), updatedAt: new Date() }).where(eq(schema.profiles.id, existing[0].id));
    } else {
      await db.insert(schema.profiles).values({ userId, fullName: String(body.ownerName), avatarInitials: String(body.ownerName).slice(0, 2).toUpperCase() });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
