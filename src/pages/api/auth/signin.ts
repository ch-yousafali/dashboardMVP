import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { verifyPassword, createSession, SESSION_COOKIE, sessionCookieOptions, getActiveWorkspace } from '@/lib/auth';
import { isEmail, validateFields } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  const result = validateFields(
    { email, password },
    {
      email: (v) => (isEmail(String(v)) ? null : 'Enter a valid email'),
      password: (v) => (String(v).length > 0 ? null : 'Enter your password'),
    },
  );

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: Object.values(result.errors)[0] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const signedToken = await createSession(user.id);
  cookies.set(SESSION_COOKIE, signedToken, sessionCookieOptions);

  // Set workspace cookie
  const activeWs = await getActiveWorkspace(user.id);
  if (activeWs) {
    cookies.set('hq_workspace', activeWs.workspace.id, { ...sessionCookieOptions, httpOnly: false });
  }

  return redirect('/');
};
