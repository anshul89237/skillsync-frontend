import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ACCESS_TOKEN_KEY = 'skillsync_token';
const REFRESH_TOKEN_KEY = 'skillsync_refresh_token';
const USER_KEY = 'skillsync_user';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')));
  } catch { return null; }
}

const OAuthRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Get user info from URL params, fall back to JWT claims if missing
    const claims = parseJwt(token);
    const email = params.get('email') || claims?.sub || claims?.email || '';
    const role = params.get('role') || claims?.role || 'ROLE_USER';
    const userId = params.get('userId') || String(claims?.userId ?? claims?.id ?? 0);

    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId: Number(userId), email, role }));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Full page reload so AuthProvider re-reads localStorage
    window.location.replace(role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f8]">
      <div className="rounded-2xl border border-[#e5e8f1] bg-white px-8 py-6 shadow-sm text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#e21849] border-t-transparent" />
        <p className="text-sm font-semibold text-[#1f2543]">Signing you in...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;

