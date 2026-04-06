import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/AuthContext';
import { learnerAPI, userAPI } from '../../core/api';
import { toast } from '../../shared/Toast';
import { LucideBadgeCheck, LucideBriefcase, LucideGoal, LucideMail, LucideMapPin, LucidePhone, LucideSparkles } from 'lucide-react';
import { allCountries } from 'country-telephone-data';

const inputClassName = 'h-12 w-full rounded-xl border border-[#d9deea] bg-white px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10';
const textareaClassName = 'min-h-[120px] w-full rounded-xl border border-[#d9deea] bg-white px-4 py-3 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10';
const selectClassName = 'h-12 w-full rounded-xl border border-[#d9deea] bg-white px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10';

// Strip native script in parentheses: "India (भारत)" → "India"
const cleanCountryName = (name: string) => name.replace(/\s*\(.*\)$/, '').trim();

// All 250 countries sorted alphabetically with their dial codes
const COUNTRY_LIST = allCountries
  .map((c) => ({ name: cleanCountryName(c.name), iso2: c.iso2.toUpperCase(), dialCode: `+${c.dialCode}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Unique dial codes sorted numerically (for the phone prefix dropdown)
const DIAL_CODES = Array.from(
  new Map(
    allCountries
      .sort((a, b) => Number(a.dialCode) - Number(b.dialCode))
      .map((c) => [`+${c.dialCode}`, { code: `+${c.dialCode}`, iso2: c.iso2.toUpperCase(), name: cleanCountryName(c.name) }])
  ).values()
);

const parseStoredLocation = (value?: string) => {
  const raw = value?.trim() || '';
  if (!raw) return { city: '', country: 'India' };

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts.slice(0, -1).join(', '), country: parts[parts.length - 1] };
  }

  return { city: raw, country: 'India' };
};

const parseStoredPhone = (value?: string) => {
  const raw = value?.trim() || '';
  if (!raw) return { countryCode: '+91', localNumber: '' };

  // Try longest-match first to avoid "+1" matching "+1868" etc.
  const sorted = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length);
  const matched = sorted.find((d) => raw.startsWith(d.code));
  if (matched) {
    return { countryCode: matched.code, localNumber: raw.slice(matched.code.length).trim() };
  }

  // Strip any leading +digits if present but unrecognised
  return { countryCode: '+91', localNumber: raw.replace(/^\+\d+\s*/, '').trim() || raw };
};

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [headline, setHeadline] = useState(user?.headline || '');
    const [learningGoal, setLearningGoal] = useState(user?.learningGoal || '');
    // Learner-service fields — loaded separately from skillsync-learners DB
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('India');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync auth-service fields when user object changes
    useEffect(() => {
      setFirstName(user?.firstName || '');
      setLastName(user?.lastName || '');
      setHeadline(user?.headline || '');
      setLearningGoal(user?.learningGoal || '');
    }, [user?.firstName, user?.lastName, user?.headline, user?.learningGoal]);

    // Load learner profile from learner-service (skillsync-learners DB)
    useEffect(() => {
      if (!user?.userId) return;
      learnerAPI.getProfile(user.userId).then((res) => {
        const profile = res.data;
        const parsedPhone = parseStoredPhone(profile?.phone);
        const parsedLocation = parseStoredLocation(profile?.location);
        setCountryCode(parsedPhone.countryCode);
        setPhoneLocalNumber(parsedPhone.localNumber);
        setCity(parsedLocation.city);
        setCountry(parsedLocation.country);
        setBio(profile?.bio || '');
      }).catch(() => {
        // No learner profile yet — fields remain empty, user fills them for the first time
      });
    }, [user?.userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const normalizedPhone = phoneLocalNumber.replace(/[^\d]/g, '');
    const normalizedLocation = [city.trim(), country.trim()].filter(Boolean).join(', ');

    setLoading(true);
    try {
        // Auth-service: identity + professional fields (skillsync-users DB)
        await userAPI.updateProfile(user.userId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          headline: headline.trim(),
          learningGoal: learningGoal.trim(),
        });
        // Learner-service: contact + personal fields (skillsync-learners DB)
        await learnerAPI.updateProfile({
          phone: normalizedPhone ? `${countryCode} ${normalizedPhone}` : '',
          location: normalizedLocation,
          bio: bio.trim(),
        });
        await refreshUser();
        toast('Profile updated successfully.', 'success');
    } catch {
      toast('Unable to update profile right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || user?.name || 'SkillSync User';
  const profileInitial = (firstName || user?.email || 'U')[0]?.toUpperCase() || 'U';
  const roleLabel = user?.role?.replace('ROLE_', '') || 'USER';
  const displayLocation = [city, country].filter(Boolean).join(', ');
  const displayPhone = phoneLocalNumber ? `${countryCode} ${phoneLocalNumber}` : '';
  const completionFields = [firstName, lastName, phoneLocalNumber, headline, city, country, learningGoal, bio];
  const completion = Math.round((completionFields.filter((value) => value.trim()).length / completionFields.length) * 100);
  const profileStatus = completion >= 85 ? 'Profile looks strong' : completion >= 55 ? 'Almost there' : 'Needs more detail';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,#ffffff_0%,#fff7f8_42%,#f6f8ff_100%)] p-8 shadow-[0_20px_60px_rgba(22,26,56,0.08)]">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#e21849]/10 blur-3xl" />
        <div className="absolute left-20 top-10 h-24 w-24 rounded-full bg-[#f5a623]/10 blur-2xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#e21849] text-3xl font-bold text-white shadow-[0_12px_30px_rgba(226,24,73,0.28)]">
              {profileInitial}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f96b2]">Profile Studio</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-[#1f2543]">{displayName}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6384]">
                  Build a profile that feels trustworthy to mentors and makes your learning intent obvious.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2543] shadow-sm">
                  <LucideMail size={13} className="text-[#e21849]" />
                  {user?.email}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e21849]/10 px-3 py-1.5 text-xs font-semibold text-[#e21849]">
                  <LucideBadgeCheck size={13} />
                  {roleLabel}
                </span>
                {displayLocation && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2543] shadow-sm">
                    <LucideMapPin size={13} className="text-[#e21849]" />
                    {displayLocation}
                  </span>
                )}
                {displayPhone && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2543] shadow-sm">
                    <LucidePhone size={13} className="text-[#e21849]" />
                    {displayPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Completion</p>
              <p className="mt-3 text-3xl font-bold text-[#1f2543]">{completion}%</p>
              <div className="mt-3 h-2 rounded-full bg-[#eef1f8]">
                <div className="h-2 rounded-full bg-[#e21849] transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Headline</p>
              <p className="mt-3 line-clamp-2 min-h-[48px] text-sm font-semibold leading-6 text-[#1f2543]">
                {headline || 'Add a sharp one-line identity for your profile.'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Status</p>
              <p className="mt-3 text-lg font-bold text-[#1f2543]">{profileStatus}</p>
              <p className="mt-1 text-xs leading-5 text-[#8f96b2]">Clear details make mentor matching and trust much better.</p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#e5e8f1] bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Identity</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1f2543]">Personal details</h2>
                <p className="mt-2 text-sm leading-6 text-[#5b6384]">Keep your core account information accurate and easy to trust.</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849] sm:inline-flex">
                <LucideSparkles size={18} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">First name</label>
                <input type="text" className={inputClassName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Last name</label>
                <input type="text" className={inputClassName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Email address</label>
                <input type="email" className={`${inputClassName} bg-[#f9fafc] text-[#8f96b2]`} value={user?.email || ''} readOnly />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Country code</label>
                <select className={selectClassName} value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  {DIAL_CODES.map((d) => (
                    <option key={`${d.code}-${d.iso2}`} value={d.code}>{`${d.code} · ${d.name}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Phone number</label>
                <input
                  type="text"
                  className={inputClassName}
                  value={phoneLocalNumber}
                  onChange={(e) => setPhoneLocalNumber(e.target.value)}
                  placeholder="9876543210"
                />
                <p className="mt-2 text-xs text-[#8f96b2]">Saved as {countryCode} plus your number.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">City</label>
                <input
                  type="text"
                  className={inputClassName}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Phagwara"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Country</label>
                <select className={selectClassName} value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.iso2} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[#8f96b2]">Typing only a city is not enough. The app now saves location as city plus country.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e5e8f1] bg-white p-7 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Professional presence</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1f2543]">What should mentors understand about you?</h2>
              <p className="mt-2 text-sm leading-6 text-[#5b6384]">This section shapes how credible, focused, and serious your profile feels.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Headline</label>
                <input
                  type="text"
                  className={inputClassName}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Example: Backend developer focused on Java, APIs and system design"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">Current learning goal</label>
                <input
                  type="text"
                  className={inputClassName}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="Example: Build production-ready Spring Boot services"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b6384]">About you</label>
                <textarea
                  className={textareaClassName}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a concise summary of your background, current level, and what kind of mentorship will help most."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#e5e8f1] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Profile signals</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-[#f7f8fc] p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849]">
                    <LucideBriefcase size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2543]">Professional identity</p>
                    <p className="text-xs leading-5 text-[#8f96b2]">A sharp headline gives your profile immediate context.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f7f8fc] p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849]">
                    <LucideGoal size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2543]">Learning goal</p>
                    <p className="text-xs leading-5 text-[#8f96b2]">Specific goals help mentors know how to guide you.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f7f8fc] p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849]">
                    <LucidePhone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2543]">Reliable contact details</p>
                    <p className="text-xs leading-5 text-[#8f96b2]">Useful for reminders, coordination, and credibility.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e5e8f1] bg-[#161a38] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a84a8]">Save changes</p>
            <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em]">Keep your profile ready for real mentorship.</h3>
            <p className="mt-3 text-sm leading-6 text-[#c8cee5]">
              Strong profiles convert better because mentors can immediately see who you are, what you want, and how to help.
            </p>

            <button
              type="submit"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e21849] px-5 text-sm font-bold text-white transition hover:bg-[#c9143f] disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Saving profile...' : 'Save Profile'}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
};

export default Profile;
