import { db, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { eq, and, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'hq_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/* ============================================================
   Password utilities
   ============================================================ */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ============================================================
   Token utilities
   ============================================================ */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

function signToken(token: string): string {
  const sig = createHmac('sha256', env.AUTH_SECRET).update(token).digest('hex');
  return `${token}.${sig}`;
}

function verifySignedToken(signed: string): string | null {
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const token = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac('sha256', env.AUTH_SECRET).update(token).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return token;
}

/* ============================================================
   Session management
   ============================================================ */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(schema.sessions).values({
    userId,
    token,
    expiresAt,
  });
  return signToken(token);
}

export async function getSession(signedToken: string | undefined) {
  if (!signedToken) return null;
  const token = verifySignedToken(signedToken);
  if (!token) return null;

  const rows = await db
    .select({
      session: schema.sessions,
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.sessions.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.session.expiresAt < new Date()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, row.session.id));
    return null;
  }

  return row;
}

export async function destroySession(signedToken: string | undefined): Promise<void> {
  if (!signedToken) return;
  const token = verifySignedToken(signedToken);
  if (!token) return;
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};

/* ============================================================
   Workspace helpers
   ============================================================ */
export async function getUserWorkspaces(userId: string) {
  const rows = await db
    .select({
      workspace: schema.workspaces,
      role: schema.members.role,
    })
    .from(schema.members)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.members.workspaceId))
    .where(eq(schema.members.userId, userId));
  return rows;
}

export async function getActiveWorkspace(userId: string, workspaceId?: string) {
  const workspaces = await getUserWorkspaces(userId);
  if (workspaces.length === 0) return null;
  if (workspaceId) {
    const match = workspaces.find((w) => w.workspace.id === workspaceId);
    if (match) return match;
  }
  return workspaces[0];
}

export async function isMemberOfWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.userId, userId), eq(schema.members.workspaceId, workspaceId)))
    .limit(1);
  return rows.length > 0;
}
