import React, { useEffect, useState } from 'react';
import { mentorAPI, userAPI, sessionAPI, paymentAPI } from '../../core/api';
import { Mentor, User, Session, Payment } from '../../types';
import { toast } from '../../shared/Toast';
import { 
  LucideUsers, 
  LucideUserCheck, 
  LucideCheckCircle2,
  LucideXCircle,
  LucideCalendar,
  LucideBadgeIndianRupee,
  LucideAlertTriangle,
  LucideStar,
  LucideActivity,
  LucideRefreshCw,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mentorRes, userRes, sessionRes, paymentRes] = await Promise.allSettled([
        mentorAPI.getApplications(),
        userAPI.getAllUsers(),
        sessionAPI.getAllSessions(),
        paymentAPI.getAllPayments(),
      ]);

      if (mentorRes.status === 'fulfilled') setPendingMentors(mentorRes.value.data);
      if (userRes.status === 'fulfilled') setAllUsers(userRes.value.data?.data ?? userRes.value.data ?? []);
      if (sessionRes.status === 'fulfilled') setAllSessions(sessionRes.value.data);
      if (paymentRes.status === 'fulfilled') setAllPayments(paymentRes.value.data);
    } catch {
      toast('Failed to load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleApprove = async (mentorId: number) => {
    setApprovingId(mentorId);
    try {
      await mentorAPI.approveMentor(mentorId);
      setPendingMentors((prev) => prev.filter((m) => m.id !== mentorId));
      toast('Mentor approved successfully.', 'success');
    } catch {
      toast('Failed to approve mentor.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const totalRevenue = allPayments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);

  const completedSessions = allSessions.filter((s) => s.status === 'COMPLETED').length;
  const activeMentors = pendingMentors.length; // pending applications

  const stats = [
    { label: 'Total Users', value: loading ? '—' : String(allUsers.length), trend: 'Registered accounts', icon: <LucideUsers size={20} />, iconBg: 'bg-[#fff0f3]', iconColor: 'text-[#e21849]' },
    { label: 'Pending Mentor Approvals', value: loading ? '—' : String(activeMentors), trend: 'Awaiting review', icon: <LucideUserCheck size={20} />, iconBg: 'bg-[#f0f7ff]', iconColor: 'text-[#3b82f6]' },
    { label: 'Sessions Completed', value: loading ? '—' : String(completedSessions), trend: 'Across all learners', icon: <LucideCalendar size={20} />, iconBg: 'bg-[#fffbeb]', iconColor: 'text-[#f59e0b]' },
    { label: 'Platform Revenue', value: loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, trend: 'From verified payments', icon: <LucideBadgeIndianRupee size={20} />, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#10b981]' },
  ];

  const recentActivity = allSessions.slice(0, 6).map((s) => ({
    text: `Session #${s.id} status: ${s.status}`,
    time: new Date(s.startTime).toLocaleDateString(),
    type: s.status === 'COMPLETED' ? 'success' : s.status === 'PENDING' ? 'info' : 'danger',
  }));

  const activityStyles: Record<string, string> = {
    success: 'bg-[#f0fdf4] text-[#10b981]',
    danger: 'bg-[#fff0f3] text-[#e21849]',
    info: 'bg-[#f0f7ff] text-[#3b82f6]',
    gold: 'bg-[#fffbeb] text-[#f59e0b]',
  };
  const activityIcon = (type: string) => {
    if (type === 'success') return <LucideCheckCircle2 size={14} />;
    if (type === 'danger') return <LucideAlertTriangle size={14} />;
    if (type === 'gold') return <LucideStar size={14} />;
    return <LucideUsers size={14} />;
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#1f2543]">Admin Console</h1>
          <p className="mt-1 text-sm text-[#8f96b2]">Platform overview — {today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e5e8f1] bg-white px-4 py-2 text-sm font-semibold text-[#5b6384] shadow-sm hover:border-[#e21849]/30 hover:text-[#e21849]"
          >
            <LucideRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <span className="inline-flex items-center rounded-full bg-[#1f2543] px-4 py-1.5 text-xs font-bold tracking-widest text-white">
            + ADMIN
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm">
            <div className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[26px] font-bold leading-none text-[#1f2543]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#8f96b2]">{stat.label}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#2f9e44]">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Pending Mentor Approvals */}
          <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-[#1f2543]">
                🏆 Pending Mentor Approvals
              </h3>
              <span className="text-sm text-[#8f96b2]">{pendingMentors.length} pending</span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-sm text-[#8f96b2]">Loading applications...</div>
            ) : pendingMentors.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e8f1] text-left text-[11px] uppercase tracking-wide text-[#8f96b2]">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Applicant</th>
                      <th className="pb-3 pr-4">Skills</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMentors.map((m, i) => {
                      const initials = m.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
                      const colors = ['bg-[#8b5cf6]', 'bg-[#e21849]', 'bg-[#3b82f6]', 'bg-[#10b981]', 'bg-[#f59e0b]'];
                      const color = colors[i % colors.length];
                      return (
                        <tr key={m.id} className="border-b border-[#f0f2f8] last:border-0">
                          <td className="py-3.5 pr-4 text-[#8f96b2]">{i + 1}</td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1f2543]">{m.fullName}</p>
                                <p className="text-xs text-[#8f96b2]">Mentor applicant</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex flex-wrap gap-1.5">
                              {m.expertise.slice(0, 3).map((s) => (
                                <span key={s} className="rounded-full bg-[#f5f7fd] px-2.5 py-1 text-[11px] font-medium text-[#5b6384]">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={approvingId === m.id}
                                onClick={() => void handleApprove(m.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#10b981]/30 bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#10b981] hover:bg-[#10b981]/10 disabled:opacity-60"
                              >
                                <LucideCheckCircle2 size={13} />
                                {approvingId === m.id ? 'Approving...' : 'Approve'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#e5e8f1] bg-[#f9fafc] p-6 text-sm text-[#8f96b2] text-center">
                No pending mentor applications right now.
              </div>
            )}
          </div>

          {/* Platform Performance */}
          <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <LucideActivity size={18} className="text-[#e21849]" />
              <h3 className="text-[17px] font-bold text-[#1f2543]">Platform Performance</h3>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-sm text-[#8f96b2]">Loading metrics...</div>
              ) : (
                [
                  {
                    label: 'Session Completion Rate',
                    value: allSessions.length
                      ? Math.round((allSessions.filter((s) => s.status === 'COMPLETED').length / allSessions.length) * 100)
                      : 0,
                    color: '#e21849',
                  },
                  {
                    label: 'Payment Success Rate',
                    value: allPayments.length
                      ? Math.round((allPayments.filter((p) => p.status === 'PAID').length / allPayments.length) * 100)
                      : 0,
                    color: '#10b981',
                  },
                  {
                    label: 'Session Acceptance Rate',
                    value: allSessions.length
                      ? Math.round((allSessions.filter((s) => s.status === 'ACCEPTED' || s.status === 'COMPLETED').length / allSessions.length) * 100)
                      : 0,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Pending Resolution Rate',
                    value: allSessions.length
                      ? Math.round(((allSessions.length - allSessions.filter((s) => s.status === 'PENDING').length) / allSessions.length) * 100)
                      : 0,
                    color: '#3b82f6',
                  },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-[#5b6384]">{bar.label}</span>
                      <strong className="text-[#1f2543]">{bar.value}%</strong>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f2f8]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Session Activity */}
        <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[17px] font-bold text-[#1f2543]">⚡ Recent Session Activity</h3>
          {loading ? (
            <div className="text-sm text-[#8f96b2]">Loading activity...</div>
          ) : recentActivity.length ? (
            <div className="space-y-3">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-[#f0f2f8] bg-[#fafbfd] p-3">
                  <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${activityStyles[act.type]}`}>
                    {activityIcon(act.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1f2543]">{act.text}</p>
                    <span className="text-xs text-[#8f96b2]">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#8f96b2]">No recent activity. Sessions will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
