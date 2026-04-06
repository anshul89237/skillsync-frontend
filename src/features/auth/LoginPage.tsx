import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../core/AuthContext';
import { authAPI } from '../../core/api';
import { env } from '../../core/env';
import { toast } from '../../shared/Toast';
import {
  LucideMail,
  LucideLock,
  LucideCalendar,
  LucideUsers,
  LucideStar,
  LucideEye,
  LucideEyeOff,
  LucideLinkedin
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  { icon: LucideMail, text: 'Find expert mentors matched to your goals' },
  { icon: LucideCalendar, text: 'Book 1-on-1 sessions at your convenience' },
  { icon: LucideUsers, text: 'Join peer learning groups and communities' },
  { icon: LucideStar, text: 'Track your growth with ratings and reviews' },
];

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Show error if redirected back from failed OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth_failed') {
      const reason = params.get('reason');
      toast(reason ? `Social sign-in failed: ${reason}` : 'Social sign-in failed. Please try again.', 'error');
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const userData = await login(data);
      toast('Welcome back! Login successful.', 'success');
      if (userData.role === 'ROLE_ADMIN') navigate('/admin');
      else navigate('/dashboard');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Login failed. Check your credentials.', 'error');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.googleLoginUrl();
  };

  const handleLinkedinLogin = () => {
    if (!env.ENABLE_LINKEDIN_LOGIN) {
      toast('LinkedIn sign-in is not configured yet. Please use Google login.', 'error');
      return;
    }
    window.location.href = authAPI.linkedinLoginUrl();
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      {/* ── Left branding panel ── */}
      <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0f1535_0%,#1a1f5f_50%,#2a195f_100%)] lg:flex lg:flex-col lg:items-start lg:justify-center lg:px-16 lg:py-16">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-[480px] w-[480px] rounded-full bg-[#e21849]/20 blur-[120px]" />
        <div className="relative z-10 max-w-[440px]">
          <h1 className="text-[52px] font-extrabold tracking-[-0.03em] text-white">
            Skill<span className="text-[#f5a623]">Sync</span>
          </h1>
          <p className="mt-3 text-[18px] leading-[1.4] text-white/80">
            Peer Learning &amp; Mentor Matching Platform
          </p>
          <div className="mt-10 space-y-4">
            {features.map((item) => (
              <div key={item.text} className="flex items-center gap-4 text-[15px] text-white/85">
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
                  <item.icon size={17} />
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Right login panel ── */}
      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 block text-center lg:hidden">
            <span className="text-2xl font-extrabold">Skill<span className="text-[#e21849]">Sync</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-[36px] font-bold leading-tight text-[#1f2543]">
              Welcome back <span aria-hidden="true">👋</span>
            </h2>
            <p className="mt-2 text-[15px] text-[#8f96b2]">Sign in to your SkillSync account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Email Address</label>
              <div className="relative">
                <LucideMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                <input
                  type="email"
                  className="h-12 w-full rounded-xl border border-[#d9deea] bg-[#f9fafc] pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:bg-white focus:ring-4 focus:ring-[#e21849]/10"
                  placeholder="rahul.sharma@example.com"
                  {...register('email')}
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Password</label>
              <div className="relative">
                <LucideLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 w-full rounded-xl border border-[#d9deea] bg-[#f9fafc] pl-11 pr-11 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:bg-white focus:ring-4 focus:ring-[#e21849]/10"
                  placeholder="••••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8f96b2] hover:bg-[#f2f4fb]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <LucideEyeOff size={16} /> : <LucideEye size={16} />}
                </button>
              </div>
              {errors.password ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.password.message}</p> : null}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[#7a819c]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#e21849]"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-semibold text-[#e21849] hover:text-[#c9143f]">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e21849] text-sm font-bold tracking-[0.06em] text-white shadow-[0_8px_20px_rgba(226,24,73,0.30)] transition hover:bg-[#c9143f] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>

            <div className="relative py-1 text-center text-sm text-[#9aa2c0]">
              <span className="relative z-10 bg-white px-3">or continue with</span>
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#e5e8f1]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9deea] bg-white text-sm font-semibold text-[#3f4768] transition hover:bg-[#f4f6fb]"
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.92h5.46c-.24 1.26-.95 2.33-2 3.05l3.24 2.52c1.89-1.74 2.98-4.3 2.98-7.35 0-.7-.06-1.37-.18-2.02H12z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.52c-.9.6-2.05.96-3.37.96-2.59 0-4.78-1.75-5.56-4.11H3.09v2.58A9.99 9.99 0 0 0 12 22z" />
                  <path fill="#4A90E2" d="M6.44 13.89A5.99 5.99 0 0 1 6.13 12c0-.66.11-1.31.31-1.89V7.53H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.47l3.35-2.58z" />
                  <path fill="#FBBC05" d="M12 5.98c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a9.99 9.99 0 0 0-8.91 5.53l3.35 2.58C7.22 7.73 9.41 5.98 12 5.98z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9deea] bg-white text-sm font-semibold text-[#3f4768] transition hover:bg-[#f4f6fb]"
                onClick={handleLinkedinLogin}
              >
                <LucideLinkedin size={15} strokeWidth={2} />
                LinkedIn
              </button>
            </div>

            <p className="pt-1 text-center text-sm text-[#8f96b2]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-[#e21849] hover:text-[#c9143f]">
                Create one free
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
