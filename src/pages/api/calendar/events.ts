import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });

  const body = await request.json();
  const [event] = await db
    .insert(schema.calendarEvents)
    .values({
      workspaceId: wsId,
      title: String(body.title || ''),
      date: String(body.date || todayISO()),
      time: String(body.time || ''),
      type: (body.type as 'meeting' | 'production' | 'deadline') || 'meeting',
      notes: String(body.notes || ''),
    })
    .returning();

  // Log activity + notification
  await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Calendar event created', sub: event.title, date: todayISO() });
  await db.insert(schema.notifications).values({
    workspaceId: wsId, title: 'New calendar event', text: event.title, time: 'Just now',
    section: 'calendar', kind: 'calendar', read: false,
  });

  return new Response(JSON.stringify({ event }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
