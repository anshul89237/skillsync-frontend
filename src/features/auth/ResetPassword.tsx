import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAPI } from '../../core/api';
import { toast } from '../../shared/Toast';
import { LucideLock, LucideArrowRight, LucideCheckCircle } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      toast('Invalid or expired reset token.', 'error');
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetFormData) => {
    try {
      await authAPI.resetPassword({ token, newPassword: data.password });
      setSuccess(true);
      toast('Password reset successful!', 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to reset password.', 'error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f8] px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[520px] rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(18,22,50,0.08)] sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold text-[#1f2543]">Set New Password</h2>
              <p className="mt-2 text-base text-[#7a819c]">Secure your SkillSync account with a strong password.</p>
            </div>

            {!success ? (
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3e4566]">New Password</label>
                  <div className="relative">
                    <LucideLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                    <input
                      type="password"
                      className="h-12 w-full rounded-xl border border-[#d9deea] bg-white pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                  </div>
                  {errors.password ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.password.message}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Confirm Password</label>
                  <div className="relative">
                    <LucideLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                    <input
                      type="password"
                      className="h-12 w-full rounded-xl border border-[#d9deea] bg-white pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.confirmPassword.message}</p> : null}
                </div>

                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e21849] text-sm font-bold tracking-[0.05em] text-white transition hover:bg-[#c9143f] disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting}>
                  {isSubmitting ? 'RESETTING...' : 'UPDATE PASSWORD'}
                  <LucideArrowRight size={16} />
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#10b981]/25 bg-[#10b981]/8 p-6 text-center">
                <LucideCheckCircle className="mx-auto mb-3 text-[#10b981]" size={44} />
                <h3 className="text-2xl font-bold text-[#1f2543]">All set!</h3>
                <p className="mt-2 text-sm text-[#5b6384]">Your password has been reset successfully. Redirecting to sign in...</p>
                <Link to="/login" className="mt-4 inline-flex text-sm font-semibold text-[#e21849] hover:text-[#c9143f]">Sign in now</Link>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ResetPassword;
