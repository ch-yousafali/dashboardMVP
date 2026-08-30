import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ============================================================
   Enums
   ============================================================ */
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);

export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'revoked']);

export const eventTypeEnum = pgEnum('event_type', ['meeting', 'production', 'deadline']);

export const preOrderStatusEnum = pgEnum('preorder_status', [
  'Sourced',
  'In Production',
  'Washing',
  'Shipped',
]);

export const videoIdeaStatusEnum = pgEnum('video_idea_status', [
  'Idea',
  'Planning',
  'In Progress',
  'Completed',
]);

export const videoIdeaPriorityEnum = pgEnum('video_idea_priority', ['Low', 'Medium', 'High']);

export const customerUpdateStateEnum = pgEnum('customer_update_state', ['Draft', 'Scheduled', 'Sent']);

export const emailStatusEnum = pgEnum('email_status', ['unread', 'read', 'flagged']);

export const bulkOrderStatusEnum = pgEnum('bulk_order_status', ['Processing', 'Delivered']);

export const sampleStatusEnum = pgEnum('sample_status', [
  'Requested',
  'In Production',
  'Shipped',
  'Received',
  'Approved',
  'Rejected',
]);

export const trackingStatusEnum = pgEnum('tracking_status', [
  'Pending',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Delayed',
]);

export const carrierEnum = pgEnum('carrier', ['UPS', 'USPS', 'FedEx', 'DHL']);

export const notificationKindEnum = pgEnum('notification_kind', [
  'calendar',
  'order',
  'tracking',
  'customer',
  'email',
  'note',
  'bulk',
  'sample',
  'video',
  'cost',
  'sales',
  'system',
]);

export const integrationProviderEnum = pgEnum('integration_provider', [
  'google_calendar',
  'google_drive',
  'google_business',
  'openai',
  'anthropic',
  'openrouter',
]);

export const integrationStatusEnum = pgEnum('integration_status', [
  'not_connected',
  'connecting',
  'connected',
  'reconnect',
  'disconnect',
  'configuration_required',
]);

/* ============================================================
   Users & profiles
   ============================================================ */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifyToken: text('email_verify_token'),
  emailVerifyExpires: timestamp('email_verify_expires'),
  resetToken: text('reset_token'),
  resetExpires: timestamp('reset_expires'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull().default(''),
  avatarInitials: text('avatar_initials'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/* ============================================================
   Workspaces & membership
   ============================================================ */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().default('My Workspace'),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: memberRoleEnum('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  status: invitationStatusEnum('status').notNull().default('pending'),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at'),
});

/* ============================================================
   Sessions
   ============================================================ */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ============================================================
   Business data — all workspace scoped
   ============================================================ */
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').default(''),
  type: eventTypeEnum('type').notNull().default('meeting'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videoIdeas = pgTable('video_ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default(''),
  status: videoIdeaStatusEnum('status').notNull().default('Idea'),
  priority: videoIdeaPriorityEnum('priority').notNull().default('Medium'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const preOrders = pgTable('pre_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  product: text('product').notNull(),
  orders: integer('orders').notNull().default(0),
  status: preOrderStatusEnum('status').notNull().default('Sourced'),
  expected: text('expected'),
  shipping: text('shipping'),
  progress: integer('progress').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customerUpdates = pgTable('customer_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  product: text('product').notNull().default(''),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  state: customerUpdateStateEnum('state').notNull().default('Draft'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  color: text('color').notNull().default('default'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const importantEmails = pgTable('important_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  sender: text('sender').notNull(),
  subject: text('subject').notNull(),
  date: text('date').notNull(),
  status: emailStatusEnum('status').notNull().default('unread'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const bulkOrders = pgTable('bulk_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  supplier: text('supplier').notNull(),
  product: text('product').notNull(),
  quantity: integer('quantity').notNull().default(0),
  cost: integer('cost').notNull().default(0),
  date: text('date').notNull(),
  status: bulkOrderStatusEnum('status').notNull().default('Processing'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const salesRecords = pgTable('sales_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull(),
  customer: text('customer').notNull(),
  items: integer('items').notNull().default(1),
  total: integer('total').notNull().default(0),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const salesDaily = pgTable('sales_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  total: integer('total').notNull().default(0),
  aov: integer('aov').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const costProfit = pgTable('cost_profit', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  monthlyCost: integer('monthly_cost').notNull().default(0),
  estimatedRevenue: integer('estimated_revenue').notNull().default(0),
  breakdown: jsonb('breakdown').$type<{ label: string; value: number; max: number }[]>().notNull().default([]),
  monthlyProfit: jsonb('monthly_profit').$type<{ m: string; profit: number }[]>().notNull().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const samples = pgTable('samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  product: text('product').notNull(),
  supplier: text('supplier').notNull(),
  status: sampleStatusEnum('status').notNull().default('Requested'),
  submitted: text('submitted'),
  expected: text('expected'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tracking = pgTable('tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
  carrier: carrierEnum('carrier').notNull().default('UPS'),
  product: text('product').notNull(),
  status: trackingStatusEnum('status').notNull().default('Pending'),
  eta: text('eta'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/* ============================================================
   Notifications & activity
   ============================================================ */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  text: text('text').notNull(),
  time: text('time').notNull(),
  section: text('section').notNull(),
  kind: notificationKindEnum('kind').notNull().default('system'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activity = pgTable('activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  sub: text('sub').notNull().default(''),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ============================================================
   Integrations
   ============================================================ */
export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  provider: integrationProviderEnum('provider').notNull(),
  status: integrationStatusEnum('status').notNull().default('not_connected'),
  connectedAccountId: text('connected_account_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/* ============================================================
   Relations
   ============================================================ */
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  workspaces: many(members),
  sessions: many(sessions),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(members),
  invitations: many(invitations),
  events: many(calendarEvents),
  videoIdeas: many(videoIdeas),
  preOrders: many(preOrders),
  customerUpdates: many(customerUpdates),
  notes: many(notes),
  emails: many(importantEmails),
  bulkOrders: many(bulkOrders),
  salesRecords: many(salesRecords),
  samples: many(samples),
  tracking: many(tracking),
  notifications: many(notifications),
  activity: many(activity),
  integrations: many(integrations),
}));

export const membersRelations = relations(members, ({ one }) => ({
  workspace: one(workspaces, { fields: [members.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [members.userId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspace: one(workspaces, { fields: [invitations.workspaceId], references: [workspaces.id] }),
  invitedBy: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  workspace: one(workspaces, { fields: [calendarEvents.workspaceId], references: [workspaces.id] }),
}));

export const videoIdeasRelations = relations(videoIdeas, ({ one }) => ({
  workspace: one(workspaces, { fields: [videoIdeas.workspaceId], references: [workspaces.id] }),
}));

export const preOrdersRelations = relations(preOrders, ({ one }) => ({
  workspace: one(workspaces, { fields: [preOrders.workspaceId], references: [workspaces.id] }),
}));

export const customerUpdatesRelations = relations(customerUpdates, ({ one }) => ({
  workspace: one(workspaces, { fields: [customerUpdates.workspaceId], references: [workspaces.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  workspace: one(workspaces, { fields: [notes.workspaceId], references: [workspaces.id] }),
}));

export const importantEmailsRelations = relations(importantEmails, ({ one }) => ({
  workspace: one(workspaces, { fields: [importantEmails.workspaceId], references: [workspaces.id] }),
}));

export const bulkOrdersRelations = relations(bulkOrders, ({ one }) => ({
  workspace: one(workspaces, { fields: [bulkOrders.workspaceId], references: [workspaces.id] }),
}));

export const salesRecordsRelations = relations(salesRecords, ({ one }) => ({
  workspace: one(workspaces, { fields: [salesRecords.workspaceId], references: [workspaces.id] }),
}));

export const samplesRelations = relations(samples, ({ one }) => ({
  workspace: one(workspaces, { fields: [samples.workspaceId], references: [workspaces.id] }),
}));

export const trackingRelations = relations(tracking, ({ one }) => ({
  workspace: one(workspaces, { fields: [tracking.workspaceId], references: [workspaces.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  workspace: one(workspaces, { fields: [activity.workspaceId], references: [workspaces.id] }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  workspace: one(workspaces, { fields: [integrations.workspaceId], references: [workspaces.id] }),
}));
