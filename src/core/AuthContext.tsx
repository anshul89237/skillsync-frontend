import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI, userAPI } from './api';
import { User, AuthResponse } from '../types';

const ACCESS_TOKEN_KEY = 'skillsync_token';
const REFRESH_TOKEN_KEY = 'skillsync_refresh_token';
const USER_KEY = 'skillsync_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  isLearner: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

type JwtClaims = {
  sub?: string;
  userId?: number;
  role?: User['role'];
};

function parseJwtClaims(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function buildDisplayName(firstName?: string, lastName?: string, fallbackName?: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || fallbackName || undefined;
}

function mapApiUser(source: any, fallback?: Partial<User>): User {
  const firstName = source?.firstName ?? fallback?.firstName;
  const lastName = source?.lastName ?? fallback?.lastName;

  return {
    userId: Number(source?.userId ?? source?.id ?? fallback?.userId ?? 0),
    email: source?.email ?? fallback?.email ?? '',
    role: source?.role ?? fallback?.role ?? 'ROLE_USER',
    firstName,
    lastName,
    name: source?.name ?? buildDisplayName(firstName, lastName, fallback?.name),
    phoneNumber: source?.phoneNumber ?? fallback?.phoneNumber,
    headline: source?.headline ?? fallback?.headline,
    location: source?.location ?? fallback?.location,
    learningGoal: source?.learningGoal ?? fallback?.learningGoal,
    bio: source?.bio ?? fallback?.bio,
    emailNotifications: source?.emailNotifications ?? fallback?.emailNotifications,
    sessionReminders: source?.sessionReminders ?? fallback?.sessionReminders,
    marketingUpdates: source?.marketingUpdates ?? fallback?.marketingUpdates,
    profileVisibility: source?.profileVisibility ?? fallback?.profileVisibility,
    twoFactorEnabled: source?.twoFactorEnabled ?? fallback?.twoFactorEnabled,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return;
    }
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedToken || !savedUser) return;

    const parsedUser = JSON.parse(savedUser) as User;
    const response = await userAPI.getUser(parsedUser.userId);
    const payload = response.data?.data ?? response.data;
    persistUser(mapApiUser(payload, parsedUser));
  }, [persistUser]);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          persistUser(JSON.parse(savedUser));
          await refreshUser();
        } catch {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    };

    void bootstrap();
  }, [persistUser, refreshUser]);

  const login = useCallback(async (credentials: any): Promise<User> => {
    const res = await authAPI.login(credentials);
    const payload = res.data?.data ?? res.data;
    const data: AuthResponse = payload ?? {};

    const resolvedToken = data.token || data.accessToken;
    const claims = resolvedToken ? parseJwtClaims(resolvedToken) : null;
    const resolvedEmail = data.email || claims?.sub;
    const resolvedRole = data.role || claims?.role;
    const resolvedUserId = data.userId ?? claims?.userId;

    if (!resolvedToken || !resolvedEmail || !resolvedRole || resolvedUserId == null) {
      throw new Error('Invalid login response from server');
    }

    setToken(resolvedToken);
    const userData = mapApiUser({
      userId: Number(resolvedUserId),
      email: resolvedEmail,
      role: resolvedRole,
    });
    localStorage.setItem(ACCESS_TOKEN_KEY, resolvedToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    persistUser(userData);

    try {
      const response = await userAPI.getUser(userData.userId);
      const payload = response.data?.data ?? response.data;
      const hydratedUser = mapApiUser(payload, userData);
      persistUser(hydratedUser);
      return hydratedUser;
    } catch {
      return userData;
    }
  }, [persistUser]);

  const register = useCallback(async (userData: any) => {
    const res = await authAPI.register(userData);
    return res.data?.data ?? res.data;
  }, []);

  const logout = useCallback(() => {
    persistUser(null);
    setToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, [persistUser]);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isMentor = user?.role === 'ROLE_MENTOR';
  const isLearner = user?.role === 'ROLE_USER' || user?.role === 'ROLE_LEARNER';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, refreshUser,
      isAuthenticated, isAdmin, isMentor, isLearner,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
