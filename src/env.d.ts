/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: {
      session: { id: string; token: string; userId: string; expiresAt: Date };
      user: { id: string; email: string; emailVerified: boolean; passwordHash: string };
      profile: { id: string; userId: string; fullName: string; avatarInitials: string | null } | null;
    } | null;
    user: { id: string; email: string; emailVerified: boolean } | null;
    profile: { id: string; userId: string; fullName: string; avatarInitials: string | null } | null;
    workspace: { id: string; name: string; ownerId: string } | null;
    role: 'owner' | 'admin' | 'member' | null;
  }
}
