import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import {
  LucideAward,
  LucideBell,
  LucideBookOpen,
  LucideCalendar,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideSettings,
  LucideShieldAlert,
  LucideStar,
  LucideUser,
  LucideUsers,
  LucideChevronLeft,
  LucideChevronRight,
} from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
    isActive
      ? 'bg-[#e21849]/15 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-[#e21849]'
      : 'text-[#9aa2c0] hover:bg-white/6 hover:text-white'
  }`;

const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || 'User';
  const profileInitial = (user?.firstName || user?.email || 'U')[0]?.toUpperCase() || 'U';
  const roleLabel = user?.role?.replace('ROLE_', '') || 'USER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const learnerNav = [
    { name: 'Dashboard', path: '/dashboard', icon: <LucideLayoutDashboard size={18} /> },
    { name: 'Find Mentors', path: '/mentors', icon: <LucideAward size={18} /> },
    { name: 'My Sessions', path: '/sessions', icon: <LucideCalendar size={18} /> },
    { name: 'Learning Groups', path: '/groups', icon: <LucideUsers size={18} /> },
    { name: 'Reviews', path: '/reviews', icon: <LucideStar size={18} /> },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: <LucideLayoutDashboard size={18} /> },
    { name: 'Manage Users', path: '/profile', icon: <LucideUsers size={18} /> },
    { name: 'Mentor Approvals', path: '/admin', icon: <LucideShieldAlert size={18} /> },
    { name: 'All Sessions', path: '/sessions', icon: <LucideCalendar size={18} /> },
    { name: 'Learning Groups', path: '/groups', icon: <LucideBookOpen size={18} /> },
  ];

  const accountNav = [
    { name: 'My Profile', path: '/profile', icon: <LucideUser size={18} /> },
    { name: 'Notifications', path: '/messages', icon: <LucideBell size={18} /> },
    { name: 'Settings', path: '/settings', icon: <LucideSettings size={18} /> },
  ];

  const primaryNav = isAdmin ? adminNav : learnerNav;
  const sidebarW = collapsed ? 'w-[68px]' : 'w-[240px]';

  return (
    <div className="flex min-h-screen bg-[#f0f2f8]">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-shrink-0 flex-col ${sidebarW} min-h-screen bg-[#161a38] transition-all duration-200`}
      >
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-0 py-5' : 'px-5 py-5'}`}>
          {!collapsed && (
            <span className="text-[22px] font-extrabold tracking-[-0.03em] text-white">
              Skill<span className="text-[#f5a623]">Sync</span>
            </span>
          )}
          {collapsed && (
            <span className="text-[20px] font-extrabold text-white">S</span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[68px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#2e3460] bg-[#1e2448] text-[#9aa2c0] shadow hover:text-white"
        >
          {collapsed ? <LucideChevronRight size={12} /> : <LucideChevronLeft size={12} />}
        </button>

        {/* Primary nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-3">
          {primaryNav.map((item) => (
            <NavLink
              key={`${item.path}-${item.name}`}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={navLinkClass}
            >
              <span className="inline-flex shrink-0 items-center justify-center">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}

          {/* Account section */}
          {!collapsed && (
            <p className="mx-1 mt-5 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#556080]">
              Account
            </p>
          )}
          {collapsed && <div className="mt-4 mb-1 h-px bg-[#2e3460]" />}
          {accountNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={navLinkClass}
            >
              <span className="inline-flex shrink-0 items-center justify-center">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className={`border-t border-[#2e3460] px-3 py-4 ${collapsed ? 'flex flex-col items-center gap-3' : ''}`}>
          {!collapsed && (
            <button
              type="button"
              onClick={goToProfile}
              className="mb-3 flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
              title="Open profile"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e21849] text-sm font-extrabold text-white">
                {profileInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="text-[10px] uppercase tracking-wide text-[#7a84a8]">
                  {roleLabel}
                </p>
              </div>
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={goToProfile}
              title="Open profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e21849] text-sm font-extrabold text-white"
            >
              {profileInitial}
            </button>
          )}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`flex items-center justify-center gap-2 rounded-xl border border-[#343b60] bg-[#1c2040] px-3 py-2.5 text-[13px] font-semibold text-[#9aa2c0] transition hover:border-[#e21849]/40 hover:text-[#e21849] ${collapsed ? 'w-10 h-10 p-0' : 'w-full'}`}
          >
            <LucideLogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex min-h-screen flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
