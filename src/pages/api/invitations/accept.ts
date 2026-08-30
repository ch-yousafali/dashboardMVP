import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const userId = locals.user?.id;
  if (!userId) return Astro.redirect('/login');

  const formData = await request.formData();
  const token = String(formData.get('token') || '');

  const rows = await db
    .select()
    .from(schema.invitations)
    .where(eq(schema.invitations.token, token))
    .limit(1);

  const invitation = rows[0];
  if (!invitation || invitation.status !== 'pending') {
    return Astro.redirect('/login?error=invalid_invitation');
  }

  // Check if user email matches
  const userRows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (userRows[0]?.email !== invitation.email) {
    return Astro.redirect('/login?error=email_mismatch');
  }

  // Add user as member
  await db.insert(schema.members).values({
    workspaceId: invitation.workspaceId,
    userId,
    role: invitation.role,
  });

  // Mark invitation as accepted
  await db
    .update(schema.invitations)
    .set({ status: 'accepted', acceptedBy: userId, acceptedAt: new Date() })
    .where(eq(schema.invitations.id, invitation.id));

  // Set workspace cookie
  Astro.cookies.set('hq_workspace', invitation.workspaceId, { path: '/', maxAge: 2592000 });

  return Astro.redirect('/');
};
