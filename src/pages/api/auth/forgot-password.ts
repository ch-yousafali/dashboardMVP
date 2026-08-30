import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { isEmail, validateFields } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();

  const result = validateFields(
    { email },
    { email: (v) => (isEmail(String(v)) ? null : 'Enter a valid email') },
  );

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: Object.values(result.errors)[0] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (rows.length === 0) {
    // Don't reveal whether the email exists
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const token = generateToken();
  await db
    .update(schema.users)
    .set({ resetToken: token, resetExpires: new Date(Date.now() + 1000 * 60 * 60) }) // 1h
    .where(eq(schema.users.id, rows[0].id));

  // TODO: send password reset email with token
  // For dev, return success
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
