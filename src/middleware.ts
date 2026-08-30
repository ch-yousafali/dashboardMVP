import { defineMiddleware } from 'astro:middleware';
import { getSession, getActiveWorkspace, SESSION_COOKIE } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface SessionProfile {
  id: string;
  userId: string;
  fullName: string;
  avatarInitials: string | null;
}

export interface SessionWorkspace {
  id: string;
  name: string;
  ownerId: string;
}

export type MemberRole = 'owner' | 'admin' | 'member';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSession(cookie);

  context.locals.session = session;
  context.locals.user = (session?.user ?? null) as SessionUser | null;
  context.locals.profile = (session?.profile ?? null) as SessionProfile | null;

  if (session?.user) {
    const wsCookie = context.cookies.get('hq_workspace')?.value;
    const activeWs = await getActiveWorkspace(session.user.id, wsCookie);
    context.locals.workspace = (activeWs?.workspace ?? null) as SessionWorkspace | null;
    context.locals.role = (activeWs?.role ?? null) as MemberRole | null;
  } else {
    context.locals.workspace = null;
    context.locals.role = null;
  }

  return next();
});
