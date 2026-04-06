import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../core/AuthContext';
import { sessionAPI } from '../../core/api';
import { Session } from '../../types';
import {
  LucideBell,
  LucideCheckCircle2,
  LucideXCircle,
  LucideClock,
  LucideRefreshCw,
  LucideFilter,
} from 'lucide-react';

type FilterType = 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

function buildNotifications(sessions: Session[], isMentor: boolean) {
  return sessions.map((s) => {
    const dateStr = new Date(s.startTime).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const timeStr = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const topic = s.topic ? `"${s.topic}"` : 'a session';

    let title = '';
    let message = '';
    let icon: 'bell' | 'check' | 'x' | 'clock' = 'bell';

    const counterpart = isMentor ? `Learner #${s.learnerId}` : `Mentor #${s.mentorId}`;

    switch (s.status) {
      case 'PENDING':
        title = isMentor ? 'New Session Request' : 'Session Pending Confirmation';
        message = isMentor
          ? `${counterpart} wants to book ${topic} on ${dateStr} at ${timeStr}.`
          : `Your request for ${topic} with ${counterpart} on ${dateStr} at ${timeStr} is waiting for confirmation.`;
        icon = 'clock';
        break;
      case 'ACCEPTED':
        title = 'Session Confirmed';
        message = `Your session ${topic} with ${counterpart} is confirmed for ${dateStr} at ${timeStr}.`;
        icon = 'check';
        break;
      case 'COMPLETED':
        title = 'Session Completed';
        message = isMentor
          ? `Session ${topic} with ${counterpart} on ${dateStr} is marked as complete.`
          : `Session ${topic} with ${counterpart} on ${dateStr} is complete. Leave a review!`;
        icon = 'check';
        break;
      case 'REJECTED':
      case 'CANCELLED':
        title = s.status === 'REJECTED' ? 'Session Declined' : 'Session Cancelled';
        message = `The session ${topic} with ${counterpart} on ${dateStr} has been ${s.status.toLowerCase()}.`;
        icon = 'x';
        break;
    }
    return { id: s.id, title, message, status: s.status, createdAt: s.startTime, icon };
  }).filter((n) => n.title);
}

const iconMap = {
  bell: <LucideBell size={16} />,
  check: <LucideCheckCircle2 size={16} />,
  x: <LucideXCircle size={16} />,
  clock: <LucideClock size={16} />,
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-[#fffbeb] text-[#b45309]',
  ACCEPTED: 'bg-[#f0fdf4] text-[#15803d]',
  COMPLETED: 'bg-[#eff6ff] text-[#1d4ed8]',
  REJECTED: 'bg-[#fff0f3] text-[#e21849]',
  CANCELLED: 'bg-[#f4f4f5] text-[#71717a]',
};

const Messages: React.FC = () => {
  const { user } = useAuth();
  const isMentor = user?.role === 'ROLE_MENTOR';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = isMentor
        ? await sessionAPI.getMentorSessions(user.userId)
        : await sessionAPI.getLearnerSessions(user.userId);
      setSessions(res.data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSessions(); }, [user]);

  const notifications = useMemo(
    () => buildNotifications(sessions, isMentor),
    [sessions, user, isMentor],
  );

  const filtered = filter === 'ALL' ? notifications : notifications.filter((n) => n.status === filter);
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const filters: FilterType[] = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f96b2]">Activity</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#1f2543]">Notifications</h1>
          <p className="mt-2 text-sm text-[#5b6384]">
            Session activity and updates from your learning timeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e5e8f1] bg-white px-4 py-2 text-sm font-semibold text-[#5b6384] shadow-sm hover:border-[#e21849]/30 hover:text-[#e21849]"
            >
              <LucideCheckCircle2 size={15} /> Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => void fetchSessions()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e21849] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#c9143f] disabled:opacity-60"
          >
            <LucideRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {([
          { label: 'Total', count: notifications.length, color: 'text-[#1f2543]' },
          { label: 'Pending', count: notifications.filter((n) => n.status === 'PENDING').length, color: 'text-[#b45309]' },
          { label: 'Confirmed', count: notifications.filter((n) => n.status === 'ACCEPTED').length, color: 'text-[#15803d]' },
          { label: 'Unread', count: unreadCount, color: 'text-[#e21849]' },
        ] as const).map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#e5e8f1] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f96b2]">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e5e8f1] bg-white p-4 shadow-sm">
        <LucideFilter size={15} className="text-[#8f96b2]" />
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'bg-[#e21849] text-white shadow-sm'
                : 'border border-[#e5e8f1] bg-white text-[#5b6384] hover:border-[#e21849]/30'
            }`}
          >
            {f === 'ALL' ? `All (${notifications.length})` : f}
          </button>
        ))}
      </div>

      {/* Notification feed */}
      {loading ? (
        <div className="rounded-2xl border border-[#e5e8f1] bg-white p-8 text-center text-sm font-semibold text-[#5b6384] shadow-sm">
          <LucideBell size={32} className="mx-auto mb-3 animate-pulse text-[#e21849]" />
          Loading your activity...
        </div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isUnread = !readIds.has(n.id);
            return (
              <article
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition cursor-pointer ${
                  isUnread ? 'border-[#e21849]/20 bg-white' : 'border-[#e5e8f1] bg-[#fafbfd]'
                }`}
                onClick={() => setReadIds((prev) => new Set(prev).add(n.id))}
              >
                <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${statusColor[n.status] ?? 'bg-[#f4f4f5] text-[#71717a]'}`}>
                  {iconMap[n.icon]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-bold ${isUnread ? 'text-[#1f2543]' : 'text-[#5b6384]'}`}>{n.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColor[n.status]}`}>{n.status}</span>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-[#e21849]" />}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#5b6384]">{n.message}</p>
                  <p className="mt-2 text-xs text-[#8f96b2]">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e5e8f1] bg-white p-10 text-center shadow-sm">
          <LucideBell size={36} className="mx-auto mb-3 text-[#d9deea]" />
          <p className="text-sm font-semibold text-[#5b6384]">
            {filter === 'ALL' ? 'No notifications yet.' : `No ${filter.toLowerCase()} sessions.`}
          </p>
          <p className="mt-1 text-xs text-[#8f96b2]">Book a session with a mentor to start your learning journey.</p>
        </div>
      )}
    </div>
  );
};

export default Messages;

