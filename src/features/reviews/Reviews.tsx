import React, { useEffect, useMemo, useState } from 'react';
import { mentorAPI, reviewAPI } from '../../core/api';
import { useAuth } from '../../core/AuthContext';
import { toast } from '../../shared/Toast';
import { Mentor } from '../../types';

const Reviews: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorId, setMentorId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoadingMentors(true);
      try {
        const response = await mentorAPI.getAllMentors();
        setMentors(response.data);
      } catch {
        setMentors([]);
        toast('Unable to load mentors for review submission.', 'error');
      } finally {
        setLoadingMentors(false);
      }
    };

    void fetchMentors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!mentorId) {
      toast('Please choose a mentor.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await reviewAPI.submitReview({
        mentorId: Number(mentorId),
        learnerId: user.userId,
        rating,
        comment,
      });
      setComment('');
      setMentorId('');
      setRating(5);
      toast('Review submitted successfully.', 'success');
    } catch {
      toast('Could not submit review right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#e5e8f1] bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-[#1f2543] mb-2">Submit Review</h1>
        <p className="text-[#8f96b2] mb-6">Rate your mentorship sessions and share feedback.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[#5b6384]">Mentor</label>
          <select
            className="h-12 w-full rounded-xl border border-[#d9deea] px-4 text-sm outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            disabled={loadingMentors || !mentors.length}
          >
            <option value="">{loadingMentors ? 'Loading mentors...' : 'Select a mentor'}</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.fullName}
              </option>
            ))}
          </select>

          <label className="block text-sm font-semibold text-[#5b6384]">Rating</label>
          <div className="flex items-center gap-2">
            {stars.map((value) => (
              <button
                key={value}
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition ${rating >= value ? 'border-[#f5bf31] bg-[#fff4d6] text-[#f5bf31]' : 'border-[#e5e8f1] bg-white text-[#c7cbe0]'}`}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>

          <label className="block text-sm font-semibold text-[#5b6384]">Comment</label>
          <textarea
            className="w-full rounded-xl border border-[#d9deea] px-4 py-3 text-sm outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what worked well in your session"
            required
          />

          <button className="inline-flex h-11 items-center justify-center rounded-xl bg-[#e21849] px-5 text-sm font-bold text-white transition hover:bg-[#c9143f] disabled:opacity-70" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>

          {!loadingMentors && !mentors.length && (
            <p className="text-sm text-[#8f96b2]">Mentor profiles are not available yet, so review submission is temporarily unavailable.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Reviews;
