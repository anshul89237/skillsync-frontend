import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorAPI } from '../../core/api';
import { useAuth } from '../../core/AuthContext';
import { Mentor } from '../../types';
import { toast } from '../../shared/Toast';
import { LucideAward, LucideSearch, LucideStar, LucideX } from 'lucide-react';

const AVATAR_COLORS = [
  'bg-[#e21849]', 'bg-[#3b82f6]', 'bg-[#10b981]',
  'bg-[#8b5cf6]', 'bg-[#f59e0b]', 'bg-[#06b6d4]',
];

// ── Apply as Mentor modal ──────────────────────────────────────────────────

interface ApplyMentorModalProps {
  onClose: () => void;
}

const ApplyMentorModal: React.FC<ApplyMentorModalProps> = ({ onClose }) => {
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [expertise, setExpertise] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expertiseList = expertise.split(',').map((s) => s.trim()).filter(Boolean);
    if (!bio.trim()) { toast('Please add a short bio.', 'warning'); return; }
    if (!expertiseList.length) { toast('Please add at least one skill.', 'warning'); return; }

    setSubmitting(true);
    try {
      await mentorAPI.applyAsMentor({
        bio: bio.trim(),
        yearsOfExperience: experience ? Number(experience) : 0,
        expertise: expertiseList,
      });
      toast('Application submitted! We will review it shortly.', 'success');
      onClose();
    } catch {
      toast('Could not submit your application. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[28px] border border-[#e5e8f1] bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7fd] text-[#8f96b2] hover:bg-[#fff0f3] hover:text-[#e21849]"
        >
          <LucideX size={15} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f3]">
            <LucideAward size={22} className="text-[#e21849]" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#1f2543]">Become a Mentor</h2>
            <p className="text-xs text-[#8f96b2]">Share your expertise and guide learners</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5b6384]">Bio</label>
            <textarea
              className="w-full rounded-xl border border-[#d9deea] px-4 py-3 text-sm outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
              rows={3}
              maxLength={400}
              placeholder="Tell learners about your background and teaching style…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />
            <p className="mt-1 text-right text-[11px] text-[#8f96b2]">{bio.length}/400</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5b6384]">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              className="h-11 w-full rounded-xl border border-[#d9deea] px-4 text-sm outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
              placeholder="e.g. 5"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5b6384]">Skills / Expertise</label>
            <input
              type="text"
              className="h-11 w-full rounded-xl border border-[#d9deea] px-4 text-sm outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
              placeholder="Java, Spring Boot, System Design"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-[#8f96b2]">Separate multiple skills with commas.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e5e8f1] px-5 py-2.5 text-sm font-semibold text-[#5b6384] hover:bg-[#f5f7fd]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#e21849] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c9143f] disabled:opacity-70"
            >
              {submitting ? 'Submitting…' : 'Apply Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const Mentors: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const canApply = user?.role !== 'ROLE_MENTOR' && user?.role !== 'ROLE_ADMIN';

  const skillFilters = useMemo(
    () => Array.from(new Set(mentors.flatMap((mentor) => mentor.expertise))).slice(0, 6),
    [mentors]
  );

  const removeFilter = (f: string) => setActiveFilters((prev) => prev.filter((x) => x !== f));
  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => (prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]));
  };

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const res = await mentorAPI.getAllMentors();
        setMentors(res.data);
      } catch {
        setMentors([]);
        toast('Unable to load mentors right now.', 'error');
      } finally {
        setLoading(false);
      }
    };
    void fetchMentors();
  }, []);

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || m.fullName.toLowerCase().includes(q) || m.expertise.some((s) => s.toLowerCase().includes(q));
    const matchesFilters = !activeFilters.length || activeFilters.every((filter) => m.expertise.includes(filter));
    return matchesSearch && matchesFilters;
  });

  const handleBookSession = (mentorId: number) => {
    const mentor = filtered.find((item) => item.id === mentorId);
    navigate('/sessions', {
      state: { mentorId, mentorName: mentor?.fullName ?? 'Selected Mentor' },
    });
  };

  return (
    <div className="space-y-6">
      {showApplyModal && <ApplyMentorModal onClose={() => setShowApplyModal(false)} />}

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1f2543]">Find a Mentor</h1>
          <p className="mt-1 text-sm text-[#8f96b2]">Discover expert mentors matched to your learning goals</p>
        </div>
        {canApply && (
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#e21849] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#c9143f]"
          >
            <LucideAward size={15} />
            Become a Mentor
          </button>
        )}
      </header>

      {/* Search + Filters bar */}
      <div className="rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e8f1] bg-[#f9fafc] px-4 focus-within:border-[#e21849]/40 focus-within:bg-white">
            <LucideSearch size={16} className="shrink-0 text-[#8f96b2]" />
            <input
              type="text"
              placeholder="Java, Spring Boot"
              className="h-11 w-full bg-transparent text-sm text-[#1f2543] outline-none placeholder:text-[#8f96b2]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active filter chips */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0f3] px-3 py-1.5 text-xs font-semibold text-[#e21849]"
            >
              {f}
              <button type="button" onClick={() => removeFilter(f)} className="text-[#e21849]/60 hover:text-[#e21849]">
                <LucideX size={11} />
              </button>
            </span>
          ))}
          {skillFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => toggleFilter(filter)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFilters.includes(filter)
                  ? 'border-[#e21849]/20 bg-[#fff0f3] text-[#e21849]'
                  : 'border-[#e5e8f1] bg-white text-[#5b6384] hover:border-[#e21849]/30'
              }`}
            >
              {filter}
            </button>
          ))}
          {(activeFilters.length > 0 || search) && (
            <button
              type="button"
              className="ml-1 text-xs font-semibold text-[#e21849] hover:text-[#c9143f]"
              onClick={() => {
                setSearch('');
                setActiveFilters([]);
              }}
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[#8f96b2]">
            Showing <strong className="text-[#1f2543]">{filtered.length}</strong> mentors matching your criteria
          </span>
          <select className="rounded-lg border border-[#e5e8f1] bg-white px-3 py-1.5 text-sm text-[#5b6384] outline-none focus:border-[#e21849]/40">
            <option>Most Relevant</option>
            <option>Highest Rated</option>
            <option>Newest</option>
          </select>
        </div>
      </div>

      {/* Mentor cards grid */}
      {loading ? (
        <div className="py-20 text-center text-sm font-semibold text-[#e21849]">Finding top mentors...</div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mentor, index) => {
            const isAvailable = index % 3 !== 1;
            return (
              <div key={mentor.id} className="relative rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm transition hover:shadow-md">
                {isAvailable && (
                  <span className="absolute right-4 top-4 rounded-full bg-[#edf9f0] px-2 py-0.5 text-[11px] font-bold text-[#2f9e44]">
                    + Available
                  </span>
                )}

                <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${AVATAR_COLORS[index % AVATAR_COLORS.length]} text-sm font-extrabold text-white`}>
                  {mentor.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>

                <h3 className="text-[16px] font-bold text-[#1f2543]">{mentor.fullName}</h3>
                <p className="mb-2 text-xs text-[#8f96b2]">{mentor.bio || 'Available for guided learning sessions.'}</p>

                <div className="mb-3 flex items-center gap-1.5 text-xs text-[#5b6384]">
                  <span className="text-[#f5bf31]">★★★★★</span>
                  <span className="font-semibold text-[#1f2543]">{mentor.rating ? mentor.rating.toFixed(1) : 'New'}</span>
                  <LucideStar size={11} className="text-[#f5bf31]" fill="#f5bf31" />
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {mentor.expertise.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#f5f7fd] px-2.5 py-1 text-[11px] font-medium text-[#5b6384]">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <strong className="text-[15px] font-bold text-[#1f2543]">Expert mentor</strong>
                  <button
                    type="button"
                    className="rounded-lg bg-[#e21849] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#c9143f]"
                    onClick={() => handleBookSession(mentor.id)}
                  >
                    Book Session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e5e8f1] bg-white p-8 text-center text-sm text-[#5b6384]">
          {mentors.length
            ? 'No mentors match the current search. Try a different skill or clear the filters.'
            : 'No mentors are available right now. Check back once mentors start publishing profiles.'}
        </div>
      )}
    </div>
  );
};

export default Mentors;
