import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI, sessionAPI } from '../../core/api';
import { Payment, Session } from '../../types';
import { useAuth } from '../../core/AuthContext';
import { toast } from '../../shared/Toast';
import { env } from '../../core/env';
import { LucideCalendarDays, LucideClock3, LucideCreditCard, LucideShieldCheck } from 'lucide-react';

type BookingState = {
  mentorId?: number;
  mentorName?: string;
};

type BookingStep = 1 | 2 | 3;

const Sessions: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(18);
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [bookedSession, setBookedSession] = useState<Session | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');

  const bookingState = (location.state as BookingState | null) ?? {};
  const mentorName = bookingState.mentorName ?? '';
  const mentorId = bookingState.mentorId;
  const slots = ['09:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'];
  const durations = [30, 60, 90];
  const calendarDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(selectedDay);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDay]);

  useEffect(() => {
    void fetchSessions();
  }, [user]);

  const handleBook = async () => {
    if (!user) {
      toast('Please sign in to book a session.', 'warning');
      return;
    }
    if (!mentorId) {
      toast('Choose a mentor before creating a booking.', 'warning');
      navigate('/mentors');
      return;
    }
    if (!topic.trim()) {
      toast('Add a session topic before continuing.', 'warning');
      return;
    }

    try {
      const bookingDate = new Date(selectedDate);
      const [time, period] = selectedSlot.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let normalizedHours = hours;
      if (period === 'PM' && hours !== 12) normalizedHours += 12;
      if (period === 'AM' && hours === 12) normalizedHours = 0;
      bookingDate.setHours(normalizedHours, minutes, 0, 0);

      const response = await sessionAPI.createSession({
        mentorId,
        learnerId: user.userId,
        topic: topic.trim(),
        startTime: bookingDate.toISOString(),
        durationMinutes: selectedDuration,
      });

      const newSession = response.data;
      setSessions((prev) => [newSession, ...prev]);
      setBookedSession(newSession);
      setBookingStep(3);
      toast('Session created! Proceed to payment to confirm.', 'success');
    } catch {
      toast('Unable to book session right now.', 'error');
    }
  };

  const handleRazorpayPayment = (payment: Payment) => {
    if (!payment.razorpayOrderId) {
      toast('Payment order not available. Please contact support.', 'error');
      return;
    }

    if (!window.Razorpay) {
      toast('Payment gateway is not loaded. Please refresh the page.', 'error');
      return;
    }

    const rzp = new window.Razorpay({
      key: env.RAZORPAY_KEY_ID,
      amount: Math.round((payment.totalAmount ?? 0) * 100),
      currency: 'INR',
      name: 'SkillSync',
      description: `Mentorship session with ${mentorName}`,
      order_id: payment.razorpayOrderId,
      handler: async (response) => {
        try {
          await paymentAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setPaymentStatus('success');
          toast('Payment successful! Session is confirmed.', 'success');
          void fetchSessions();
        } catch {
          setPaymentStatus('failed');
          toast('Payment verification failed. Contact support.', 'error');
        }
      },
      prefill: {
        email: user?.email,
      },
      theme: { color: '#e21849' },
      modal: {
        ondismiss: () => {
          if (paymentStatus !== 'success') {
            toast('Payment cancelled. Your session is still pending.', 'warning');
          }
        },
      },
    });
    rzp.open();
  };

  const handleProceedToPayment = async () => {
    if (!bookedSession || !user) return;
    setPaymentStatus('loading');
    try {
      const hours = selectedDuration / 60;
      const paymentRes = await paymentAPI.processPayment({
        learnerId: user.userId,
        mentorId: mentorId!,
        sessionId: bookedSession.id,
        hours,
        paymentMethod: 'razorpay',
      });
      const payment = paymentRes.data;
      handleRazorpayPayment(payment);
    } catch {
      setPaymentStatus('failed');
      toast('Unable to initiate payment. Please try again.', 'error');
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = user?.role === 'ROLE_MENTOR'
        ? await sessionAPI.getMentorSessions(user.userId)
        : user
          ? await sessionAPI.getLearnerSessions(user.userId)
          : await sessionAPI.getAllSessions();
      setSessions(res.data);
    } catch {
      setSessions([]);
      toast('Unable to load your session timeline right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    const styles: Record<Session['status'], string> = {
      'ACCEPTED': 'bg-success/10 text-success border-success/20',
      'PENDING': 'bg-warning/10 text-warning border-warning/20',
      'COMPLETED': 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
      'REJECTED': 'bg-danger/10 text-danger border-danger/20',
      'CANCELLED': 'bg-dim/10 text-dim border-dim/20'
    };
    return styles[status] || 'bg-dim/10 text-dim';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-[#1f2543]">Book a Session</h1>
        <p className="text-sm text-[#5b6384]">
          {mentorName ? `Schedule a 1-on-1 session with ${mentorName}.` : 'Choose a mentor from the discovery page to start a booking.'}
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e5e8f1] bg-white p-4 shadow-sm">
        {([
          { num: 1, label: 'Select Date' },
          { num: 2, label: 'Choose Slot' },
          { num: 3, label: 'Confirm & Pay' },
        ] as const).map((step, i, arr) => (
          <React.Fragment key={step.num}>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${bookingStep >= step.num ? 'bg-[#e21849]/10 text-[#e21849]' : 'bg-[#f2f4fb] text-[#8f96b2]'}`}>
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${bookingStep >= step.num ? 'bg-[#e21849]' : 'bg-[#d9deea] text-[#5b6384]'}`}>
                {step.num}
              </span>
              {step.label}
            </div>
            {i < arr.length - 1 && <div className="h-px w-8 bg-[#e5e8f1]" />}
          </React.Fragment>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm space-y-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1f2543]"><LucideCalendarDays size={16} /> Select Date & Time Slot</h2>

          <div className="flex items-center justify-between">
            <strong>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
            <div className="flex gap-2">
              <button type="button" className="h-8 w-8 rounded-lg border border-[#d9deea] text-[#5b6384]">‹</button>
              <button type="button" className="h-8 w-8 rounded-lg border border-[#d9deea] text-[#5b6384]">›</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <button
                key={day}
                type="button"
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${selectedDay === day
                  ? 'border-[#e21849] bg-[#e21849] text-white'
                  : 'border-[#e5e8f1] bg-white text-[#5b6384] hover:border-[#e21849]/40'}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1f2543]">
              Available slots on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${selectedSlot === slot
                    ? 'border-[#e21849] bg-[#e21849]/10 text-[#e21849]'
                    : 'border-[#e5e8f1] bg-white text-[#5b6384] hover:border-[#e21849]/40'}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1f2543]">Session Duration</h3>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${selectedDuration === minutes
                    ? 'border-[#e21849] bg-[#e21849]/10 text-[#e21849]'
                    : 'border-[#e5e8f1] bg-white text-[#5b6384] hover:border-[#e21849]/40'}`}
                  onClick={() => setSelectedDuration(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#1f2543]">Session Topic</h3>
            <input
              type="text"
              className="premium-input"
              placeholder="What would you like to cover in this session?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <button className="premium-btn btn-primary w-full" type="button" onClick={() => void handleBook()}>
            Continue to Confirmation
          </button>
        </div>

        <aside className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[17px] font-bold text-[#1f2543]">Session Summary</h2>

          {mentorName ? (
            <>
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f5f7fd] p-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#e21849] font-bold text-white">
                  {mentorName.split(' ').map((part: string) => part[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-[#1f2543]">{mentorName}</p>
                  <p className="text-xs text-[#8f96b2]">Mentor selected from discovery</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  { label: 'Date', value: selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  { label: 'Time', value: `${selectedSlot} IST` },
                  { label: 'Duration', value: `${selectedDuration} minutes` },
                  { label: 'Format', value: 'Video Call' },
                  { label: 'Topic', value: topic.trim() || 'Add a topic to finalize your request' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-[#8f96b2]">{row.label}</span>
                    <strong className="text-right text-[#1f2543]">{row.value}</strong>
                  </div>
                ))}
              </div>

              {/* Payment confirmation panel — shown after session is created */}
              {bookingStep === 3 && bookedSession && (
                <div className="mt-6 space-y-4">
                  <div className="h-px bg-[#e5e8f1]" />
                  <div className="flex items-center gap-2">
                    <LucideCreditCard size={16} className="text-[#e21849]" />
                    <h3 className="text-sm font-bold text-[#1f2543]">Payment Required</h3>
                  </div>
                  <p className="text-xs leading-5 text-[#5b6384]">
                    Complete &nbsp;payment to confirm your session. You'll be redirected to Razorpay's secure checkout.
                  </p>
                  {paymentStatus === 'success' ? (
                    <div className="flex items-center gap-2 rounded-xl bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#15803d]">
                      <LucideShieldCheck size={16} /> Payment confirmed!
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleProceedToPayment()}
                      disabled={paymentStatus === 'loading'}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e21849] text-sm font-bold text-white shadow-sm hover:bg-[#c9143f] disabled:opacity-60"
                    >
                      <LucideCreditCard size={16} />
                      {paymentStatus === 'loading' ? 'Opening Razorpay...' : 'Pay Now'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d9deea] bg-[#f9fafc] p-4 text-sm text-[#5b6384]">
              Select a mentor from the mentors page to unlock booking details here.
              <button
                type="button"
                className="mt-3 inline-flex rounded-lg bg-[#e21849] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c9143f]"
                onClick={() => navigate('/mentors')}
              >
                Browse Mentors
              </button>
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-2xl border border-[#e5e8f1] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#1f2543]">Your Sessions</h2>
          <span className="inline-flex items-center gap-1 text-xs text-[#5b6384]"><LucideClock3 size={14} /> Upcoming & recent</span>
        </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-[#d9deea] bg-[#f9fafc] p-6 text-sm text-[#8f96b2]">Syncing your timeline...</div>
      ) : sessions.length ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e5e8f1] bg-white p-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-[#f2f4fb] text-[#1f2543]">
                <span>{new Date(session.startTime).toLocaleDateString('en-US', { day: '2-digit' })}</span>
                <small className="text-xs text-[#8f96b2]">{new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}</small>
              </div>

              <div className="min-w-[200px] flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-lg">
                    {user?.role === 'ROLE_MENTOR'
                      ? `Session with Learner #${session.learnerId}`
                      : `Session with Mentor #${session.mentorId}`}
                  </h3>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusBadge(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#5b6384]">
                  <div className="inline-flex items-center gap-1">
                    <LucideClock3 size={14} />
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    {user?.role === 'ROLE_MENTOR' ? `Mentor #${session.mentorId}` : `Learner #${session.learnerId}`}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {session.status === 'ACCEPTED' && (
                  <button className="premium-btn btn-primary text-xs" type="button">Join Call</button>
                )}
                {session.status === 'PENDING' && (
                  <span className="rounded-full bg-[#fff7e6] px-3 py-1 text-xs font-semibold text-[#b7791f]">Awaiting confirmation</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d9deea] bg-[#f9fafc] p-6 text-sm text-[#8f96b2]">
          No sessions yet. Book your first session from the mentors page to build your learning timeline.
        </div>
      )}
      </section>
    </div>
  );
};

export default Sessions;
