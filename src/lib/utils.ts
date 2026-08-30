import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function todayISO(): string {
  const t = new Date();
  return isoDate(t.getFullYear(), t.getMonth(), t.getDate());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function fmtDateFull(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function escapeHtml(str: string): string {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'In Production': 'badge-blue',
    Washing: 'badge-purple',
    Sourced: 'badge-neutral',
    Shipped: 'badge-green',
    Delivered: 'badge-green',
    Processing: 'badge-orange',
    Pending: 'badge-neutral',
    'In Transit': 'badge-blue',
    'Out for Delivery': 'badge-purple',
    Delayed: 'badge-red',
    Requested: 'badge-neutral',
    Received: 'badge-green',
    Approved: 'badge-green',
    Rejected: 'badge-red',
    Idea: 'badge-neutral',
    Planning: 'badge-blue',
    'In Progress': 'badge-purple',
    Completed: 'badge-green',
    Sent: 'badge-green',
    Scheduled: 'badge-blue',
    Draft: 'badge-neutral',
    unread: 'badge-blue',
    read: 'badge-neutral',
    flagged: 'badge-red',
  };
  return map[status] || 'badge-neutral';
}

export function eventTypeClass(type: string): string {
  return type === 'production' ? 'type-production' : type === 'deadline' ? 'type-deadline' : '';
}

export { MONTH_NAMES, WEEKDAYS };
