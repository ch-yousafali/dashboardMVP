import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { hashPassword, generateToken, createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { isEmail, isStrongPassword, isNonEmpty, validateFields } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('name') || '').trim();

  const result = validateFields(
    { email, password, name: fullName },
    {
      email: (v) => (isEmail(String(v)) ? null : 'Enter a valid email'),
      password: (v) => (isStrongPassword(String(v)) ? null : 'Password must be at least 8 characters'),
      name: (v) => (isNonEmpty(String(v)) ? null : 'Enter your name'),
    },
  );

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: Object.values(result.errors)[0] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Check if user exists
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) {
    return new Response(
      JSON.stringify({ error: 'An account with this email already exists' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = generateToken();

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      passwordHash,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
    })
    .returning({ id: schema.users.id });

  // Create profile
  await db.insert(schema.profiles).values({
    userId: user.id,
    fullName,
    avatarInitials: fullName.slice(0, 2).toUpperCase(),
  });

  // Create default workspace
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name: `${fullName}'s Workspace`, ownerId: user.id })
    .returning({ id: schema.workspaces.id });

  // Add user as owner member
  await db.insert(schema.members).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: 'owner',
  });

  // Create session
  const signedToken = await createSession(user.id);
  cookies.set(SESSION_COOKIE, signedToken, sessionCookieOptions);
  cookies.set('hq_workspace', workspace.id, { ...sessionCookieOptions, httpOnly: false });

  // TODO: send verification email with verifyToken
  // For now, auto-verify in dev
  await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, user.id));

  return redirect('/?welcome=1');
};
