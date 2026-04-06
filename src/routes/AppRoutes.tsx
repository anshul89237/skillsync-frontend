import React, { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import SidebarLayout from '../layouts/SidebarLayout';

const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));
const OAuthRedirect = lazy(() => import('../features/auth/OAuthRedirect'));
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../features/auth/ResetPassword'));
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const Mentors = lazy(() => import('../features/mentors/Mentors'));
const Sessions = lazy(() => import('../features/sessions/Sessions'));
const Groups = lazy(() => import('../features/groups/Groups'));
const Reviews = lazy(() => import('../features/reviews/Reviews'));
const Profile = lazy(() => import('../features/profile/Profile'));
const Messages = lazy(() => import('../features/messages/Messages'));
const Settings = lazy(() => import('../features/settings/Settings'));

const ScreenLoader: React.FC<{ label?: string }> = ({ label = 'Loading workspace...' }) => (
  <div className="flex min-h-screen items-center justify-center bg-app px-6 py-10 text-ink">
    <div className="rounded-[20px] border border-line bg-surface px-6 py-5 text-sm font-semibold shadow-shell">{label}</div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <ScreenLoader label="Checking authentication..." />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <ScreenLoader label="Verifying admin access..." />;
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const RoleRoute: React.FC<{ roles: string[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const ProtectedLayout: React.FC = () => (
  <ProtectedRoute>
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  </ProtectedRoute>
);

const NotFoundPage: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center px-4">
    <div className="w-full max-w-xl rounded-[20px] border border-line bg-surface p-8 text-center shadow-shell">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">404</p>
      <h1 className="font-display text-3xl font-bold text-ink">Page Not Found</h1>
      <p className="mt-3 text-sm text-dim">The route you requested does not exist in the current frontend workspace.</p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mentor" element={<RoleRoute roles={['ROLE_MENTOR']}><Sessions /></RoleRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;