import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../core/AuthContext';
import { authAPI } from '../../core/api';
import { toast } from '../../shared/Toast';
import {
  LucideMail,
  LucideLock,
  LucideArrowRight,
  LucideCalendar,
  LucideUsers,
  LucideStar,
  LucideLinkedin
} from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const features = [
  { icon: LucideMail, text: 'Get matched with domain-specific mentors' },
  { icon: LucideCalendar, text: 'Schedule sessions and learning plans' },
  { icon: LucideUsers, text: 'Join active peer communities by skill area' },
  { icon: LucideStar, text: 'Build a trusted profile with reviews' },
];

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
      toast('Account created! Please sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Registration failed.', 'error');
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = authAPI.googleLoginUrl();
  };

  const handleLinkedinSignup = () => {
    window.location.href = authAPI.linkedinLoginUrl();
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0f1535_0%,#1b1d59_55%,#4d1f64_100%)] lg:flex lg:flex-col lg:items-start lg:justify-center lg:px-16 lg:py-16">
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-[480px] w-[480px] rounded-full bg-[#f83f64]/20 blur-[120px]" />
        <div className="relative z-10 max-w-[440px]">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">Skill<span className="text-[#f5a623]">Sync</span></h1>
          <p className="mt-4 text-xl text-white/80">Create your account and start your growth journey.</p>

          <div className="mt-10 space-y-4">
            {features.map((item) => (
              <div key={item.text} className="flex items-center gap-4 text-[15px] text-white/85">
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <item.icon size={17} />
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 block text-center lg:hidden">
            <span className="text-2xl font-extrabold">Skill<span className="text-[#e21849]">Sync</span></span>
          </div>
          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-[#1f2543]">Create account</h2>
            <p className="mt-2 text-sm text-[#8f96b2]">Start as a learner and grow your profile over time.</p>
          </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3e4566]">First Name</label>
                  <input
                    className="h-12 w-full rounded-xl border border-[#d9deea] px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                    placeholder="Rahul"
                    {...registerField('firstName')}
                  />
                  {errors.firstName ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.firstName.message}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Last Name</label>
                  <input
                    className="h-12 w-full rounded-xl border border-[#d9deea] px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                    placeholder="Sharma"
                    {...registerField('lastName')}
                  />
                  {errors.lastName ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.lastName.message}</p> : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Email Address</label>
                <div className="relative">
                  <LucideMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                  <input
                    type="email"
                    className="h-12 w-full rounded-xl border border-[#d9deea] bg-white pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                    placeholder="rahul.sharma@example.com"
                    {...registerField('email')}
                  />
                </div>
                {errors.email ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Password</label>
                <div className="relative">
                  <LucideLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                  <input
                    type="password"
                    className="h-12 w-full rounded-xl border border-[#d9deea] bg-white pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                    placeholder="••••••••"
                    {...registerField('password')}
                  />
                </div>
                {errors.password ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.password.message}</p> : null}
              </div>

              <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e21849] text-sm font-bold tracking-[0.05em] text-white transition hover:bg-[#c9143f] disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting}>
                {isSubmitting ? 'CREATING ACCOUNT...' : 'FINISH REGISTRATION'}
                <LucideArrowRight size={16} />
              </button>

              <div className="relative py-1 text-center text-sm text-[#9aa2c0]">
                <span className="relative z-10 bg-white px-3">or continue with</span>
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#e5e8f1]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9deea] bg-white text-sm font-semibold text-[#3f4768] transition hover:bg-[#f9fafc]" onClick={handleGoogleSignup}>
                  <span className="social-logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.92h5.46c-.24 1.26-.95 2.33-2 3.05l3.24 2.52c1.89-1.74 2.98-4.3 2.98-7.35 0-.7-.06-1.37-.18-2.02H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.52c-.9.6-2.05.96-3.37.96-2.59 0-4.78-1.75-5.56-4.11H3.09v2.58A9.99 9.99 0 0 0 12 22z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M6.44 13.89A5.99 5.99 0 0 1 6.13 12c0-.66.11-1.31.31-1.89V7.53H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.47l3.35-2.58z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12 5.98c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a9.99 9.99 0 0 0-8.91 5.53l3.35 2.58C7.22 7.73 9.41 5.98 12 5.98z"
                      />
                    </svg>
                  </span>
                  Google
                </button>
                <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9deea] bg-white text-sm font-semibold text-[#3f4768] transition hover:bg-[#f9fafc]" onClick={handleLinkedinSignup}>
                  <span aria-hidden="true">
                    <LucideLinkedin size={14} strokeWidth={2.2} />
                  </span>
                  LinkedIn
                </button>
              </div>
            </form>

            <div className="pt-4 text-center text-sm text-[#8f96b2]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#e21849] hover:text-[#c9143f]">Sign in here</Link>
            </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
