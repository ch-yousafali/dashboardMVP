import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export type Role = 'owner' | 'admin' | 'member';

export const ROLE_RANK: Record<Role, number> = {
  member: 0,
  admin: 1,
  owner: 2,
};

export function canManage(role: Role | undefined | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canInvite(role: Role | undefined | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canChangeRoles(role: Role | undefined | null): boolean {
  return role === 'owner';
}

export async function getMemberRole(userId: string, workspaceId: string): Promise<Role | null> {
  const rows = await db
    .select({ role: schema.members.role })
    .from(schema.members)
    .where(and(eq(schema.members.userId, userId), eq(schema.members.workspaceId, workspaceId)))
    .limit(1);
  return (rows[0]?.role as Role) ?? null;
}

export function roleAtLeast(role: Role | null, min: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
