import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/AuthContext';
import { userAPI } from '../../core/api';
import { toast } from '../../shared/Toast';
import { UserSettings } from '../../types';
import { LucideBellRing, LucideEye, LucideLockKeyhole, LucideShieldCheck, LucideSparkles } from 'lucide-react';

type SettingsState = UserSettings;

const toggleClassName = (enabled: boolean) =>
  `relative inline-flex h-7 w-12 items-center rounded-full transition ${enabled ? 'bg-[#e21849]' : 'bg-[#d6dceb]'}`;

const panelClassName = 'rounded-[28px] border border-[#e5e8f1] bg-white p-6 shadow-sm';

const defaultSettings: SettingsState = {
  emailNotifications: true,
  sessionReminders: true,
  marketingUpdates: false,
  profileVisibility: 'learners',
  twoFactorEnabled: false,
};

const settingsKey = (userId: number) => `skillsync_settings_${userId}`;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setForm(defaultSettings);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await userAPI.getSettings(user.userId);
        const payload = res.data.data as Partial<SettingsState>;
        setForm({
          emailNotifications: payload.emailNotifications ?? defaultSettings.emailNotifications,
          sessionReminders: payload.sessionReminders ?? defaultSettings.sessionReminders,
          marketingUpdates: payload.marketingUpdates ?? defaultSettings.marketingUpdates,
          profileVisibility: payload.profileVisibility ?? defaultSettings.profileVisibility,
          twoFactorEnabled: payload.twoFactorEnabled ?? defaultSettings.twoFactorEnabled,
        });
      } catch {
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(settingsKey(user.userId));
          if (raw) {
            const payload = JSON.parse(raw) as Partial<SettingsState>;
            setForm({
              emailNotifications: payload.emailNotifications ?? defaultSettings.emailNotifications,
              sessionReminders: payload.sessionReminders ?? defaultSettings.sessionReminders,
              marketingUpdates: payload.marketingUpdates ?? defaultSettings.marketingUpdates,
              profileVisibility: payload.profileVisibility ?? defaultSettings.profileVisibility,
              twoFactorEnabled: payload.twoFactorEnabled ?? defaultSettings.twoFactorEnabled,
            });
          } else {
            setForm(defaultSettings);
          }
        } catch {
          setForm(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [user]);

  const setField = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await userAPI.updateSettings(user.userId, form);
      localStorage.setItem(settingsKey(user.userId), JSON.stringify(form));
      toast('Settings saved successfully.', 'success');
    } catch {
      toast('Unable to save settings right now.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = [form.emailNotifications, form.sessionReminders, form.marketingUpdates, form.twoFactorEnabled].filter(Boolean).length;
  const visibilityLabel = form.profileVisibility === 'public' ? 'Public' : form.profileVisibility === 'learners' ? 'Learners only' : 'Private';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,#ffffff_0%,#f7f9ff_38%,#fff6f8_100%)] p-8 shadow-[0_20px_60px_rgba(22,26,56,0.08)]">
        <div className="absolute right-10 top-0 h-36 w-36 rounded-full bg-[#e21849]/10 blur-3xl" />
        <div className="absolute left-24 bottom-0 h-28 w-28 rounded-full bg-[#3b82f6]/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f96b2]">Control Center</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-[#1f2543]">Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5b6384]">
              Fine-tune how SkillSync communicates with you, how visible your profile is, and how secure your account feels.
            </p>
          </div>

          {!loading && (
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Enabled controls</p>
                <p className="mt-3 text-3xl font-bold text-[#1f2543]">{enabledCount}/4</p>
                <p className="mt-1 text-xs leading-5 text-[#8f96b2]">Communication and security features currently switched on.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Visibility</p>
                <p className="mt-3 text-lg font-bold text-[#1f2543]">{visibilityLabel}</p>
                <p className="mt-1 text-xs leading-5 text-[#8f96b2]">Who can view your learner presence inside the product.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Storage</p>
                <p className="mt-3 text-lg font-bold text-[#1f2543]">Local profile settings</p>
                <p className="mt-1 text-xs leading-5 text-[#8f96b2]">These preferences are kept on this device for your current account.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-[#e5e8f1] bg-white p-6 text-sm font-semibold text-[#5b6384] shadow-sm">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className={panelClassName}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Notifications</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1f2543]">Communication preferences</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6384]">Choose which updates are worth your attention and keep the noise low.</p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849] sm:inline-flex">
                  <LucideBellRing size={18} />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'emailNotifications' as const,
                    title: 'Email notifications',
                    description: 'Receive important account and activity updates by email.',
                  },
                  {
                    key: 'sessionReminders' as const,
                    title: 'Session reminders',
                    description: 'Get reminded before upcoming mentorship sessions.',
                  },
                  {
                    key: 'marketingUpdates' as const,
                    title: 'Product updates',
                    description: 'Hear about new features, launches, and curated recommendations.',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setField(item.key, !form[item.key])}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#edf0f7] px-4 py-4 text-left transition hover:border-[#e21849]/25 hover:bg-[#fcfcfe]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1f2543]">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#8f96b2]">{item.description}</p>
                    </div>
                    <span className={toggleClassName(form[item.key])}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className={panelClassName}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Privacy</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1f2543]">Profile visibility</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6384]">Control how discoverable your learning profile is inside the platform.</p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#3b82f6] sm:inline-flex">
                  <LucideEye size={18} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  {
                    value: 'public',
                    title: 'Public',
                    description: 'Visible to everyone using the platform.',
                  },
                  {
                    value: 'learners',
                    title: 'Learners only',
                    description: 'Shared more selectively inside learning flows.',
                  },
                  {
                    value: 'private',
                    title: 'Private',
                    description: 'Hidden unless absolutely needed in your account.',
                  },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setField('profileVisibility', option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.profileVisibility === option.value
                        ? 'border-[#e21849] bg-[#fff0f3] shadow-sm'
                        : 'border-[#e5e8f1] bg-white hover:border-[#e21849]/25'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.profileVisibility === option.value ? 'text-[#e21849]' : 'text-[#1f2543]'}`}>{option.title}</p>
                    <p className="mt-2 text-xs leading-5 text-[#8f96b2]">{option.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className={panelClassName}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f96b2]">Security</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1f2543]">Account protection</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6384]">Simple controls that make your account feel safer and more deliberate.</p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#edf9f0] text-[#2f9e44] sm:inline-flex">
                  <LucideShieldCheck size={18} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setField('twoFactorEnabled', !form.twoFactorEnabled)}
                className="flex w-full items-center justify-between rounded-2xl border border-[#edf0f7] px-4 py-4 text-left transition hover:border-[#e21849]/25 hover:bg-[#fcfcfe]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#e21849]">
                    <LucideLockKeyhole size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2543]">Two-factor authentication</p>
                    <p className="mt-1 text-xs leading-5 text-[#8f96b2]">Require an additional verification step when accessing your account.</p>
                  </div>
                </div>
                <span className={toggleClassName(form.twoFactorEnabled)}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </button>
            </section>

            <section className="rounded-[28px] border border-[#e5e8f1] bg-[#161a38] p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a84a8]">Preference summary</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-[#c8cee5]">Notifications enabled</span>
                  <span className="font-semibold text-white">{enabledCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-[#c8cee5]">Profile visibility</span>
                  <span className="font-semibold text-white">{visibilityLabel}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-[#c8cee5]">Security mode</span>
                  <span className="font-semibold text-white">{form.twoFactorEnabled ? '2FA enabled' : 'Standard sign-in'}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-[#c8cee5]">
                These settings are currently saved locally for this account on this device, which keeps the experience fast without changing the backend.
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e21849] px-5 text-sm font-bold text-white transition hover:bg-[#c9143f] disabled:opacity-70"
                disabled={saving}
              >
                {saving ? 'Saving settings...' : 'Save Settings'}
              </button>
            </section>

            <section className={`${panelClassName} bg-[linear-gradient(135deg,#fff8eb_0%,#ffffff_100%)]`}>
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0d3] text-[#b7791f]">
                  <LucideSparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1f2543]">Professional default</p>
                  <p className="mt-1 text-xs leading-5 text-[#8f96b2]">
                    Good defaults are turned on already. Use this page to refine the experience, not to fight the system.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
