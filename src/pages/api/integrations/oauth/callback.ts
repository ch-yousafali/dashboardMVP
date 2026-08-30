import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { env } from '@/lib/env';

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return Astro.redirect('/login');

  const connectedAccountId = url.searchParams.get('connected_account_id') || url.searchParams.get('id');
  const status = url.searchParams.get('status');

  if (!connectedAccountId) {
    return Astro.redirect('/settings/integrations?error=no_account');
  }

  // Find the integration by connectedAccountId
  const rows = await db
    .select()
    .from(schema.integrations)
    .where(and(eq(schema.integrations.workspaceId, wsId), eq(schema.integrations.connectedAccountId, connectedAccountId)))
    .limit(1);

  if (rows.length === 0) {
    return Astro.redirect('/settings/integrations?error=not_found');
  }

  // Update status based on OAuth result
  const newStatus = status === 'success' || status === 'active' ? 'connected' : 'configuration_required';
  await db
    .update(schema.integrations)
    .set({ status: newStatus as any, updatedAt: new Date() })
    .where(eq(schema.integrations.id, rows[0].id));

  return Astro.redirect('/settings/integrations?connected=1');
};
