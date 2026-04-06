import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAPI } from '../../core/api';
import { toast } from '../../shared/Toast';
import {
  LucideMail,
  LucideArrowRight,
  LucideArrowLeft,
  LucideCalendar,
  LucideUsers,
  LucideStar
} from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const features = [
  { icon: LucideMail, text: 'Secure email-based password recovery' },
  { icon: LucideCalendar, text: 'Resume your booked sessions instantly' },
  { icon: LucideUsers, text: 'Rejoin your mentor groups and chats' },
  { icon: LucideStar, text: 'Keep tracking progress and reviews' },
];

const ForgotPassword: React.FC = () => {
  const [emailValue, setEmailValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await authAPI.forgotPassword(data.email);
      setEmailValue(data.email);
      setSubmitted(true);
      toast('Reset link sent to your email!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send reset link.', 'error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f8]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#172457_0%,#1b1d59_55%,#4d1f64_100%)] px-16 py-14 text-white lg:block">
          <div className="absolute -left-24 bottom-[-120px] h-72 w-72 rounded-full bg-[#f83f64]/20 blur-2xl" />
          <div className="relative z-10 mt-28 max-w-lg">
            <h1 className="text-5xl font-extrabold tracking-tight text-white">Skill<span className="text-[#fca311]">Sync</span></h1>
            <p className="mt-4 text-xl text-white/80">Recover your account and continue learning.</p>

            <div className="mt-10 space-y-4 text-lg">
              {features.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                    <item.icon size={16} />
                  </span>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[480px] rounded-3xl bg-white p-8 shadow-[0_20px_40px_rgba(18,22,50,0.08)] sm:p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-[#1f2543]">Reset password</h2>
              <p className="mt-2 text-base text-[#7a819c]">We&apos;ll send a recovery link to your email.</p>
            </div>

            {!submitted ? (
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Email Address</label>
                  <div className="relative">
                    <LucideMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2c0]" size={16} />
                    <input
                      type="email"
                      className="h-12 w-full rounded-xl border border-[#d9deea] bg-white pl-11 pr-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
                      placeholder="rahul.sharma@example.com"
                      {...register('email')}
                    />
                  </div>
                  {errors.email ? <p className="mt-1 text-xs font-medium text-[#e6495d]">{errors.email.message}</p> : null}
                </div>

                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e21849] text-sm font-bold tracking-[0.05em] text-white transition hover:bg-[#c9143f] disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting}>
                  {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
                  <LucideArrowRight size={16} />
                </button>

                <Link to="/register" className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#d9deea] text-sm font-semibold text-[#3f4768] transition hover:bg-[#f9fafc]">
                  Create one free account
                </Link>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#10b981]/25 bg-[#10b981]/8 p-5">
                <h3 className="text-xl font-bold text-[#1f2543]">Check your inbox</h3>
                <p className="mt-2 text-sm text-[#5b6384]">If an account exists for {emailValue}, you will receive a reset link shortly.</p>
              </div>
            )}

            <div className="pt-6 text-center">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#e21849] hover:text-[#c9143f]">
                <LucideArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
