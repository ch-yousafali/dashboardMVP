import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateToken } from '@/lib/auth';
import { canInvite } from '@/lib/permissions';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const wsId = locals.workspace?.id;
  const userId = locals.user?.id;
  const role = locals.role;
  if (!wsId || !userId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  if (!canInvite(role)) return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });

  const { email, memberRole } = await request.json();
  if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });

  const token = generateToken();
  await db.insert(schema.invitations).values({
    workspaceId: wsId,
    email: String(email).toLowerCase(),
    role: (memberRole as 'owner' | 'admin' | 'member') || 'member',
    token,
    invitedBy: userId,
  });

  // TODO: send invitation email
  const inviteUrl = `${process.env.APP_URL || 'http://localhost:4321'}/invitation?token=${token}`;
  return new Response(JSON.stringify({ ok: true, inviteUrl }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
