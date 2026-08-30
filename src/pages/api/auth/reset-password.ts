import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isStrongPassword, validateFields } from '@/lib/validation';
import { eq, and, gt } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');

  const result = validateFields(
    { password },
    { password: (v) => (isStrongPassword(String(v)) ? null : 'Password must be at least 8 characters') },
  );

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: Object.values(result.errors)[0] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.resetToken, token), gt(schema.users.resetExpires, new Date())))
    .limit(1);

  if (rows.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired reset token' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(schema.users)
    .set({ passwordHash, resetToken: null, resetExpires: null })
    .where(eq(schema.users.id, rows[0].id));

  return redirect('/login?reset=1');
};
