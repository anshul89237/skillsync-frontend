import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideArrowRight, LucideBell, LucideCalendarDays, LucideStar, LucideUsers } from 'lucide-react';
import { useAuth } from '../../core/AuthContext';
import { groupAPI, mentorAPI, sessionAPI } from '../../core/api';
import { Group, Mentor, Session } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.firstName || user?.name || user?.email?.split('@')[0] || 'User';
  const avatarInitial = (user?.firstName || user?.email || 'U')[0]?.toUpperCase() || 'U';
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const sessionPromise = user?.role === 'ROLE_MENTOR'
          ? sessionAPI.getMentorSessions(user.userId)
          : user
            ? sessionAPI.getLearnerSessions(user.userId)
            : sessionAPI.getAllSessions();

        const [mentorResult, groupResult, sessionResult] = await Promise.allSettled([
          mentorAPI.getAllMentors(),
          groupAPI.getAllGroups(),
          sessionPromise,
        ]);

        setMentors(mentorResult.status === 'fulfilled' ? mentorResult.value.data : []);
        setGroups(groupResult.status === 'fulfilled' ? groupResult.value.data : []);
        setSessions(sessionResult.status === 'fulfilled' ? sessionResult.value.data : []);
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
  }, [user]);

  const mentorNameMap = useMemo(
    () => new Map(mentors.map((mentor) => [mentor.id, mentor.fullName])),
    [mentors],
  );

  const recommendedMentors = useMemo(
    () => [...mentors].sort((left, right) => right.rating - left.rating).slice(0, 3),
    [mentors],
  );

  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status === 'PENDING' || session.status === 'ACCEPTED').slice(0, 5),
    [sessions],
  );

  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'COMPLETED').length,
    [sessions],
  );

  const stats = [
    { label: 'Upcoming Sessions', value: String(upcomingSessions.length), meta: upcomingSessions.length ? 'Scheduled next' : 'No upcoming sessions', metaColor: 'text-[#e21849]', icon: <LucideCalendarDays size={20} />, iconBg: 'bg-[#fff0f3]', iconColor: 'text-[#e21849]' },
    { label: 'Available Mentors', value: String(mentors.length), meta: mentors.length ? 'Across your network' : 'No mentors available yet', metaColor: 'text-[#2f9e44]', icon: <LucideUsers size={20} />, iconBg: 'bg-[#f0f7ff]', iconColor: 'text-[#3b82f6]' },
    { label: 'Active Groups', value: String(groups.length), meta: groups.length ? 'Communities you can join' : 'No groups yet', metaColor: 'text-[#2f9e44]', icon: <LucideUsers size={20} />, iconBg: 'bg-[#f0f7ff]', iconColor: 'text-[#3b82f6]' },
    { label: 'Sessions Completed', value: String(completedSessions), meta: completedSessions ? 'Your completed learning sessions' : 'No completed sessions yet', metaColor: 'text-[#2f9e44]', icon: <LucideStar size={20} />, iconBg: 'bg-[#fffbeb]', iconColor: 'text-[#f59e0b]' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1f2543]">
            Good morning, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-[#8f96b2]">{today} — Here&apos;s your learning overview</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e8f1] bg-white shadow-sm hover:border-[#e21849]/30"
          >
            <LucideBell size={16} className="text-[#5b6384]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e21849]" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            title="Open profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e21849] text-sm font-extrabold text-white shadow-sm"
          >
            {avatarInitial}
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm">
            <div className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[30px] font-bold leading-none text-[#1f2543]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#8f96b2]">{stat.label}</p>
              <p className={`mt-0.5 text-[11px] font-semibold ${stat.metaColor}`}>{stat.meta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Mentors */}
      <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#1f2543]">Recommended Mentors</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#e21849] hover:text-[#c9143f]"
            onClick={() => navigate('/mentors')}
          >
            View all <LucideArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-[#e5e8f1] bg-[#f9fafc] p-6 text-sm font-semibold text-[#8f96b2]">Loading mentor recommendations...</div>
        ) : recommendedMentors.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendedMentors.map((mentor, index) => (
              <div key={mentor.id} className="rounded-xl border border-[#e5e8f1] p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${['bg-[#e21849]', 'bg-[#3b82f6]', 'bg-[#10b981]'][index % 3]} font-bold text-white`}>
                      {mentor.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-[#1f2543]">{mentor.fullName}</p>
                      <p className="text-xs text-[#8f96b2]">{mentor.bio || 'Available for guided sessions'}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex items-center gap-1.5 text-xs text-[#5b6384]">
                  <span className="text-[#f5bf31]">★★★★★</span>
                  <span>{mentor.rating ? mentor.rating.toFixed(1) : 'New mentor'}</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-full bg-[#f5f7fd] px-2.5 py-1 text-[11px] font-medium text-[#5b6384]">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-bold text-[#1f2543]">Mentor profile</strong>
                  <button
                    type="button"
                    className="rounded-lg bg-[#e21849] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#c9143f]"
                    onClick={() => navigate('/sessions', { state: { mentorId: mentor.id, mentorName: mentor.fullName } })}
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#e5e8f1] bg-[#f9fafc] p-6 text-sm text-[#5b6384]">No mentor recommendations are available yet. Explore all mentors to start booking.</div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#1f2543]">Upcoming Sessions</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#e21849] hover:text-[#c9143f]"
            onClick={() => navigate('/sessions')}
          >
            Book new <LucideArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-[#e5e8f1] bg-[#f9fafc] p-6 text-sm font-semibold text-[#8f96b2]">Loading your upcoming sessions...</div>
        ) : upcomingSessions.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e8f1]">
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f96b2]">Date &amp; Time</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f96b2]">Mentor</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f96b2]">Topic</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f96b2]">Duration</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f96b2]">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSessions.map((session) => (
                <tr key={session.id} className="border-b border-[#f0f2f8] last:border-0">
                  <td className="py-3.5 pr-4 text-[#5b6384]">
                    <span className="inline-flex items-center gap-1.5">
                      <LucideCalendarDays size={13} className="text-[#8f96b2]" />
                      {new Date(session.startTime).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-[#1f2543]">{mentorNameMap.get(session.mentorId) ?? `Mentor #${session.mentorId}`}</td>
                  <td className="py-3.5 pr-4 text-[#5b6384]">Learning session</td>
                  <td className="py-3.5 pr-4 text-[#5b6384]">{Math.max(30, Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000))} min</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${session.status === 'ACCEPTED' ? 'bg-[#edf9f0] text-[#2f9e44]' : 'bg-[#fff8ea] text-[#d08911]'}`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#e5e8f1] bg-[#f9fafc] p-6 text-sm text-[#5b6384]">No sessions booked yet. Start by choosing a mentor and booking your first session.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
