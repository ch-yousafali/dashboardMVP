import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: string;
  title: string;
  text: string;
  time: string;
  section: string;
  kind: string;
  read: boolean;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  calendar: '<path d="M7 2v3M17 2v3M4 9h16M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Z" stroke-width="1.6"/>',
  order: '<path d="M5 8h14l-1 12H6L5 8ZM8 8a4 4 0 0 1 8 0" stroke-width="1.6"/>',
  tracking: '<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke-width="1.5"/>',
  customer: '<path d="M4 5h16v11H9l-5 4V5Z" stroke-width="1.6"/>',
  email: '<path d="M3 5h18v14H3zM3 7l9 6 9-6" stroke-width="1.6"/>',
  note: '<path d="M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z" stroke-width="1.6"/>',
  bulk: '<path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" stroke-width="1.6"/>',
  sample: '<path d="M9 3h6l1 5-4 12-4-12 1-5Z" stroke-width="1.6"/>',
  video: '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h9A1.5 1.5 0 0 1 16 6.5v11A1.5 1.5 0 0 1 14.5 19h-9A1.5 1.5 0 0 1 4 17.5v-11Z" stroke-width="1.6"/>',
  cost: '<circle cx="12" cy="12" r="8.5" fill="none" stroke-width="1.6"/><path d="M12 7.5v9" stroke-width="1.6"/>',
  sales: '<path d="M4 19V10M10 19V5M16 19v-7M22 19H2" stroke-width="1.6"/>',
  system: '<path d="M12 3.5c-3 0-5 2.2-5 5.4v3.1c0 .7-.25 1.4-.7 1.94L5 15.7c-.6.72-.1 1.8.83 1.8h12.34c.93 0 1.43-1.08.83-1.8l-1.3-1.76a3.1 3.1 0 0 1-.7-1.94V8.9c0-3.2-2-5.4-5-5.4Z" stroke-width="1.6"/>',
};

const SECTION_ROUTES: Record<string, string> = {
  calendar: '/calendar',
  'video-ideas': '/video-ideas',
  'pre-orders': '/pre-orders',
  'customer-updates': '/customer-updates',
  sales: '/sales',
  notes: '/notes',
  'important-emails': '/important-emails',
  'bulk-orders': '/bulk-orders',
  'cost-profit': '/cost-profit',
  samples: '/samples',
  tracking: '/tracking',
};

interface Props {
  workspaceId: string;
}

export default function NotificationsIsland({ workspaceId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // ignore
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await fetch(`/api/notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleItemClick = (n: Notification) => {
    markRead(n.id);
    setOpen(false);
    const route = SECTION_ROUTES[n.section] || '/';
    window.location.href = route;
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="notification-wrap" ref={wrapRef} style={{ display: 'none' }}>
      {/* This island is hidden — the Topbar.astro renders the visible button.
          We sync state via window events instead. */}
      <SyncHidden
        notifications={notifications}
        unread={unread}
        open={open}
        onToggle={handleClick}
        onMarkAll={markAllRead}
        onItemClick={handleItemClick}
      />
    </div>
  );
}

/**
 * This component syncs with the DOM elements rendered by Topbar.astro.
 * Since the topbar button/panel are server-rendered for SEO/perf, we
 * hydrate them imperatively here.
 */
function SyncHidden({
  notifications,
  unread,
  open,
  onToggle,
  onMarkAll,
  onItemClick,
}: {
  notifications: Notification[];
  unread: number;
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onMarkAll: () => void;
  onItemClick: (n: Notification) => void;
}) {
  useEffect(() => {
    const count = document.getElementById('notificationCount');
    if (count) {
      count.textContent = unread > 99 ? '99+' : String(unread);
      count.classList.toggle('visible', unread > 0);
    }
  }, [unread]);

  useEffect(() => {
    const panel = document.getElementById('notificationPanel');
    const btn = document.getElementById('notificationBtn');
    if (panel) panel.classList.toggle('open', open);
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }, [open]);

  useEffect(() => {
    const list = document.getElementById('notificationList');
    if (!list) return;
    if (notifications.length === 0) {
      list.innerHTML = '<div class="notification-empty">You are all caught up.</div>';
      return;
    }
    list.innerHTML = notifications
      .map(
        (n) => `
      <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" role="button" tabindex="0">
        <div class="notification-icon">
          <svg viewBox="0 0 24 24" fill="none">${NOTIFICATION_ICONS[n.kind] || NOTIFICATION_ICONS.system}</svg>
        </div>
        <div class="notification-content">
          <div class="notification-title-row">
            <span class="notification-title"></span>
            <span class="notification-time">${n.time}</span>
          </div>
          <div class="notification-text"></div>
        </div>
        ${n.read ? '' : '<span class="notification-unread-dot"></span>'}
      </div>`,
      )
      .join('');

    // Set text content safely (avoid XSS)
    notifications.forEach((n) => {
      const item = list.querySelector(`[data-id="${n.id}"]`);
      if (item) {
        const title = item.querySelector('.notification-title');
        const text = item.querySelector('.notification-text');
        if (title) title.textContent = n.title;
        if (text) text.textContent = n.text;
      }
    });

    // Wire click handlers
    list.querySelectorAll('[data-id]').forEach((el) => {
      const id = el.getAttribute('data-id');
      const n = notifications.find((x) => x.id === id);
      if (!n) return;
      el.addEventListener('click', () => onItemClick(n));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(n);
        }
      });
    });
  }, [notifications, onItemClick]);

  useEffect(() => {
    const markAll = document.getElementById('markAllNotificationsRead');
    if (markAll) {
      const handler = (e: Event) => {
        e.stopPropagation();
        onMarkAll();
      };
      markAll.addEventListener('click', handler);
      return () => markAll.removeEventListener('click', handler);
    }
  }, [onMarkAll]);

  return null;
}
