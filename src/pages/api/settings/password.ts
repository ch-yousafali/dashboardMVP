import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  if (newPassword.length < 8) return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400 });

  const rows = await db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (rows.length === 0) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

  const valid = await verifyPassword(currentPassword, rows[0].passwordHash);
  if (!valid) return new Response(JSON.stringify({ error: 'Current password is incorrect' }), { status: 401 });

  const passwordHash = await hashPassword(newPassword);
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, userId));

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
