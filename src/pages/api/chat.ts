import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { chat, isProviderConfigured, type LLMProvider } from '@/lib/llm';
import { todayISO, addDays, fmtDateFull, capitalize, MONTH_NAMES } from '@/lib/utils';

const MONTH_LOOKUP = MONTH_NAMES.reduce((acc, name, i) => {
  acc[name.toLowerCase()] = i;
  acc[name.slice(0, 3).toLowerCase()] = i;
  return acc;
}, {} as Record<string, number>);

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDateFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\btomorrow\b/.test(lower)) return addDays(todayISO(), 1);
  if (/\btoday\b/.test(lower)) return todayISO();
  if(/\bnext week\b/.test(lower)) return addDays(todayISO(), 7);

  let m = lower.match(/\bin (\d+) days?\b/);
  if (m) return addDays(todayISO(), parseInt(m[1], 10));

  m = lower.match(/\b([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (m && MONTH_LOOKUP[m[1]] !== undefined) {
    const month = MONTH_LOOKUP[m[1]];
    const day = parseInt(m[2], 10);
    let year = new Date().getFullYear();
    let candidate = isoDate(year, month, day);
    if (candidate < todayISO()) candidate = isoDate(year + 1, month, day);
    return candidate;
  }

  m = lower.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (m) {
    const month = parseInt(m[1], 10) - 1, day = parseInt(m[2], 10);
    let year = new Date().getFullYear();
    let candidate = isoDate(year, month, day);
    if (candidate < todayISO()) candidate = isoDate(year + 1, month, day);
    return candidate;
  }
  return null;
}

const STAGE_KEYWORDS = [
  { re: /\bsourc(ed|ing)\b/, stage: 'Sourced' as const },
  { re: /\b(in )?production\b|\bstarted producing\b|\b(fabric |it |material )?(has )?arrived\b|\breceived\b/, stage: 'In Production' as const },
  { re: /\bwash(ing|ed)?\b/, stage: 'Washing' as const },
  { re: /\bshipp(ed|ing)\b/, stage: 'Shipped' as const },
];

export const POST: APIRoute = async ({ request, locals }) => {
  const wsId = locals.workspace?.id;
  if (!wsId) return new Response(JSON.stringify({ error: 'No workspace' }), { status: 400 });

  const { text } = await request.json();
  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: 'No message' }), { status: 400 });
  }

  // Fetch current data for context
  const preOrders = await db.select().from(schema.preOrders).where(eq(schema.preOrders.workspaceId, wsId));
  const events = await db.select().from(schema.calendarEvents).where(eq(schema.calendarEvents.workspaceId, wsId));
  const notes = await db.select().from(schema.notes).where(eq(schema.notes.workspaceId, wsId));

  const lower = text.toLowerCase();
  let actionTag: string | undefined;
  let reload = false;

  // Try to handle actions locally first (fast path)
  const stageMatch = STAGE_KEYWORDS.find((k) => k.re.test(lower));

  function findMatchingProduct(text: string) {
    const lower = text.toLowerCase();
    let match = preOrders.find((p) => lower.includes(p.product.toLowerCase()));
    if (match) return match;
    match = preOrders.find((p) => {
      const shortName = p.product.split(/[—-]/)[0].trim().toLowerCase();
      return shortName.length > 2 && lower.includes(shortName);
    });
    return match || null;
  }

  const product = findMatchingProduct(text);

  // Intent: update production stage
  if (stageMatch && product) {
    await db.update(schema.preOrders).set({ status: stageMatch.stage, updatedAt: new Date() }).where(eq(schema.preOrders.id, product.id));
    await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Pre-order updated', sub: `${product.product} moved to ${stageMatch.stage}`, date: todayISO() });

    let reply = `Got it — I've marked "${product.product}" as ${stageMatch.stage}.`;
    const date = parseDateFromText(text);
    if (date) {
      const [ev] = await db.insert(schema.calendarEvents).values({
        workspaceId: wsId, title: `Next step — ${product.product}`, date, time: '', type: 'production', notes: 'Auto-created from AI chat',
      }).returning();
      await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Calendar event created', sub: ev.title, date: todayISO() });
      reply += ` I've also booked "${ev.title}" on ${fmtDateFull(date)}.`;
      actionTag = `Updated status + scheduled ${date}`;
    } else {
      actionTag = `Status updated to ${stageMatch.stage}`;
    }
    reload = true;
    return new Response(JSON.stringify({ reply, actionTag, reload }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Intent: status question
  if (/\b(status|stage)\b/.test(lower) && product) {
    const reply = `"${product.product}" is currently at: ${product.status}. Expected arrival ${fmtDateFull(product.expected || '')}, shipping ${fmtDateFull(product.shipping || '')}.`;
    return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Intent: what's on the calendar
  if (/\b(what'?s on|upcoming|this week|my calendar|schedule)\b/.test(lower) && !/\bschedule (a|an|the)\b/.test(lower)) {
    const today = todayISO();
    const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    if (upcoming.length === 0) {
      return new Response(JSON.stringify({ reply: "You don't have any upcoming events yet." }), { headers: { 'Content-Type': 'application/json' } });
    }
    const list = upcoming.map((e) => `• ${e.title} — ${fmtDateFull(e.date)}`).join('\n');
    return new Response(JSON.stringify({ reply: `Here's what's coming up:\n${list}` }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Intent: create calendar event
  if (/\b(schedule|book|create (an? )?event|set up a meeting|add (an? )?event)\b/.test(lower)) {
    const date = parseDateFromText(text) || addDays(todayISO(), 3);
    let title = text.replace(/^(please\s+)?(schedule|book|create an event|create event|add an event|add event|set up a meeting)\b/i, '').trim();
    title = title.replace(/\bfor\b\s*$/i, '').trim();
    if (!title) title = product ? `Meeting — ${product.product}` : 'New event';
    if (title.length > 60) title = title.slice(0, 60) + '…';
    const [ev] = await db.insert(schema.calendarEvents).values({
      workspaceId: wsId, title: capitalize(title), date, time: '', type: 'meeting', notes: 'Auto-created from AI chat',
    }).returning();
    await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Calendar event created', sub: ev.title, date: todayISO() });
    actionTag = `Event created — ${date}`;
    reload = true;
    return new Response(JSON.stringify({ reply: `Done — I've scheduled "${ev.title}" for ${fmtDateFull(date)}. You can adjust it any time from the Calendar tab.`, actionTag, reload }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Intent: add a note / reminder
  if (/\b(remind me to|add a note|add note|note:|remember)\b/.test(lower)) {
    let noteText = text.replace(/^(please\s+)?(remind me to|add a note[:\s]*|add note[:\s]*|note:|remember (to|that)?)\s*/i, '').trim();
    if (!noteText) noteText = text;
    await db.insert(schema.notes).values({ workspaceId: wsId, text: capitalize(noteText), pinned: false, date: todayISO() });
    await db.insert(schema.activity).values({ workspaceId: wsId, text: 'Note added', sub: noteText.slice(0, 50), date: todayISO() });
    actionTag = 'Note added';
    reload = true;
    return new Response(JSON.stringify({ reply: `Saved as a note: "${capitalize(noteText)}"`, actionTag, reload }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Fallback: use LLM if configured
  const provider: LLMProvider = isProviderConfigured('openai') ? 'openai' : isProviderConfigured('anthropic') ? 'anthropic' : isProviderConfigured('openrouter') ? 'openrouter' : 'openai';

  if (!isProviderConfigured(provider)) {
    return new Response(JSON.stringify({
      reply: `I can help with production updates, scheduling events, notes, and quick status checks. Try things like "Fabric arrived for [product]", "Schedule a meeting for Sept 5", or "What stage is [product] in?"\n\nTo enable AI-powered responses, configure an LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY) in your settings.`,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const context = `You are a business assistant for a clothing business. Current pre-orders: ${preOrders.map(p => `${p.product} (${p.status})`).join(', ')}. Upcoming events: ${events.filter(e => e.date >= todayISO()).slice(0, 5).map(e => `${e.title} on ${e.date}`).join(', ')}. Notes: ${notes.slice(0, 5).map(n => n.text).join('; ')}.`;
    const result = await chat(
      [
        { role: 'system', content: context },
        { role: 'user', content: text },
      ],
      { provider },
    );
    return new Response(JSON.stringify({ reply: result.text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({
      reply: `I can help with production updates, scheduling events, notes, and quick status checks. Try things like "Fabric arrived for [product]", "Schedule a meeting for Sept 5", or "What stage is [product] in?"`,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};
