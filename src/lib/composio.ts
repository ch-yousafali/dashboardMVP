import { env } from '@/lib/env';

/**
 * Composio integration layer for Google Calendar, Google Drive, and
 * Google Business Profile. All calls are server-side.
 *
 * Composio manages connected accounts via OAuth, so we never store raw
 * Google tokens — we store the Composio connected_account_id reference.
 */

export type GoogleProvider = 'google_calendar' | 'google_drive' | 'google_business';

const COMPOSIO_BASE = 'https://api.composio.dev/v1';

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': env.COMPOSIO_API_KEY || '',
  };
}

export function isComposioConfigured(): boolean {
  return !!env.COMPOSIO_API_KEY;
}

/**
 * Initiate an OAuth connection for a Google service via Composio.
 * Returns a redirect URL the user should be sent to.
 */
export async function initiateConnection(
  provider: GoogleProvider,
  redirectUri: string,
  userId: string,
): Promise<{ redirectUrl: string; connectedAccountId: string }> {
  if (!isComposioConfigured()) {
    throw new Error('Composio is not configured. Set COMPOSIO_API_KEY in .env.');
  }
  const res = await fetch(`${COMPOSIO_BASE}/auth/connect`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      toolkit: provider,
      redirect_uri: redirectUri,
      user_id: `hq_${userId}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Composio connect failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    redirectUrl: data.redirect_url ?? data.connection?.redirect_url,
    connectedAccountId: data.connection_id ?? data.connected_account_id ?? '',
  };
}

/**
 * Check the status of a Composio connected account.
 */
export async function getConnectionStatus(connectedAccountId: string): Promise<{
  status: 'active' | 'initiated' | 'failed' | 'expired';
}> {
  if (!isComposioConfigured()) {
    throw new Error('Composio is not configured.');
  }
  const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/${connectedAccountId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    return { status: 'failed' };
  }
  const data = await res.json();
  return { status: data.status ?? 'failed' };
}

/**
 * Execute a Composio action for a connected account.
 */
export async function executeAction(
  connectedAccountId: string,
  actionName: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  if (!isComposioConfigured()) {
    throw new Error('Composio is not configured.');
  }
  const res = await fetch(`${COMPOSIO_BASE}/actions/execute`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      action_name: actionName,
      connected_account_id: connectedAccountId,
      params,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Composio action failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data;
}
