/**
 * Setup script — creates a demo user, workspace, and seeds data.
 * Run with: npx tsx src/db/setup-demo.ts
 */
import 'dotenv/config';
import { db, schema } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { seed } from './seed';

async function main() {
  const email = 'maya@aldenandco.com';
  const name = 'Maya Alden';
  const password = 'password123';

  // Check if user exists
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user) {
    const passwordHash = await hashPassword(password);
    [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash, emailVerified: true })
      .returning({ id: schema.users.id, email: schema.users.email, emailVerified: schema.users.emailVerified, passwordHash: schema.users.passwordHash });

    await db.insert(schema.profiles).values({
      userId: user!.id,
      fullName: name,
      avatarInitials: 'MA',
    });

    const [workspace] = await db
      .insert(schema.workspaces)
      .values({ name: 'Alden & Co.', ownerId: user!.id })
      .returning({ id: schema.workspaces.id });

    await db.insert(schema.members).values({
      workspaceId: workspace!.id,
      userId: user!.id,
      role: 'owner',
    });

    console.log('Demo user created:', email);
    console.log('Workspace ID:', workspace!.id);
    console.log('Password:', password);

    // Seed the workspace
    process.env.SEED_WORKSPACE_ID = workspace!.id;
    await seed();
  } else {
    console.log('Demo user already exists:', email);
    const [ws] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.ownerId, user!.id))
      .limit(1);
    console.log('Workspace ID:', ws?.id);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
