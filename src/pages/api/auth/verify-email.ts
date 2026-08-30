import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const token = String(formData.get('token') || '');

  if (!token) {
    return redirect('/login?error=invalid_token');
  }

  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.emailVerifyToken, token))
    .limit(1);

  if (rows.length === 0) {
    return redirect('/login?error=invalid_token');
  }

  await db
    .update(schema.users)
    .set({ emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null })
    .where(eq(schema.users.id, rows[0].id));

  return redirect('/login?verified=1');
};
