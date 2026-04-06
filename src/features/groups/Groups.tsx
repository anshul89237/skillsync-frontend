import React, { useState, useEffect } from 'react';
import { groupAPI } from '../../core/api';
import { Group } from '../../types';
import { toast } from '../../shared/Toast';
import { LucidePlus, LucideSearch, LucideUsers, LucideX } from 'lucide-react';

const GROUP_ICONS = ['🚀', '🤖', '📊', '☁️', '⚡', '🎨'];

const CATEGORY_OPTIONS = ['General', 'Backend', 'Frontend', 'DevOps', 'AI/ML', 'Data Science', 'Design', 'Mobile', 'Cloud', 'Security'];

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('Group name is required.', 'warning'); return; }
    if (!description.trim()) { toast('Description is required.', 'warning'); return; }
    setSaving(true);
    try {
      await groupAPI.createGroup({ name: name.trim(), description: description.trim(), category });
      toast('Group created successfully.', 'success');
      onCreated();
      onClose();
    } catch {
      toast('Could not create group.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[28px] border border-[#e5e8f1] bg-white p-8 shadow-[0_32px_64px_rgba(22,26,56,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7fd] text-[#5b6384] hover:bg-[#e5e8f1]"
        >
          <LucideX size={16} />
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8f96b2]">Community</p>
        <h2 className="mt-2 text-2xl font-bold text-[#1f2543]">Create a new group</h2>
        <p className="mt-2 text-sm text-[#5b6384]">Build a peer learning community around a topic or skill.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Boot Mastery"
              maxLength={80}
              className="h-12 w-full rounded-xl border border-[#d9deea] px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this group is about and who should join..."
              rows={3}
              maxLength={300}
              className="w-full rounded-xl border border-[#d9deea] px-4 py-3 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e4566]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#d9deea] bg-white px-4 text-sm text-[#1f2543] outline-none transition focus:border-[#e21849]/50 focus:ring-4 focus:ring-[#e21849]/10"
            >
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#e5e8f1] bg-white py-3 text-sm font-semibold text-[#5b6384] hover:bg-[#f5f7fd]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#e21849] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#c9143f] disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('All Groups');

  const tabs = ['All Groups', 'My Groups', 'Trending', 'Recommended'];

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await groupAPI.getAllGroups();
      setGroups(res.data);
    } catch {
      setGroups([]);
      toast('Unable to load learning groups right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchGroups(); }, []);

  const handleJoin = async (groupId: number) => {
    if (joinedIds.has(groupId)) return;
    try {
      await groupAPI.joinGroup(groupId);
      toast('Joined group successfully.', 'success');
      setJoinedIds((prev) => new Set(prev).add(groupId));
      setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g)));
    } catch {
      toast('Unable to join group right now.', 'error');
    }
  };

  const visibleGroups = groups.filter((g) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    const matchesTab = activeTab === 'All Groups'
      || (activeTab === 'My Groups' && joinedIds.has(g.id))
      || (activeTab === 'Trending' && g.memberCount >= 25)
      || (activeTab === 'Recommended' && !joinedIds.has(g.id));
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => void fetchGroups()}
        />
      )}

      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#1f2543]">Learning Groups</h1>
          <p className="mt-1 text-sm text-[#8f96b2]">Join peer communities and learn together</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#e21849] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#c9143f]"
          onClick={() => setShowCreateModal(true)}
        >
          <LucidePlus size={16} />
          + Create New Group
        </button>
      </header>

      {/* Search + Tabs */}
      <div className="rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#e5e8f1] bg-[#f9fafc] px-4 focus-within:border-[#e21849]/40 focus-within:bg-white">
          <LucideSearch size={16} className="shrink-0 text-[#8f96b2]" />
          <input
            type="text"
            placeholder="Search groups by topic, skill..."
            className="h-11 w-full bg-transparent text-sm text-[#1f2543] outline-none placeholder:text-[#8f96b2]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'border border-[#e21849]/20 bg-[#fff0f3] text-[#e21849]'
                  : 'text-[#5b6384] hover:text-[#1f2543]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Group list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[#8f96b2]">Loading communities...</div>
      ) : visibleGroups.length ? (
        <div className="space-y-4">
          {visibleGroups.map((group, index) => {
            const isJoined = joinedIds.has(group.id);
            return (
              <article
                key={group.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#e5e8f1] bg-white p-5 shadow-sm md:flex-row md:items-start"
              >
                {/* Left content */}
                <div className="flex flex-1 gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#f5f7fd] text-2xl">
                    {GROUP_ICONS[index % GROUP_ICONS.length]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-baseline gap-3">
                      <h3 className="text-[16px] font-bold text-[#1f2543]">{group.name}</h3>
                      <span className="text-xs text-[#8f96b2]">
                        <LucideUsers size={11} className="mr-1 inline" />
                        {group.memberCount} members
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-[#5b6384]">{group.description}</p>
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#f5f7fd] px-2.5 py-1 text-[11px] font-medium text-[#5b6384]">
                        {group.category}
                      </span>
                      <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-[11px] font-semibold text-[#e21849]">
                        Public Group
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[#8f96b2]">
                      <span className="text-[#2f9e44]">● Open for new members</span>
                      <span>{group.category} community</span>
                    </div>
                  </div>
                </div>

                {/* Right: member count + join button */}
                <div className="flex flex-col items-end gap-2 self-start">
                  <div className="text-right">
                    <p className="text-[26px] font-bold leading-none text-[#1f2543]">{group.memberCount}</p>
                    <p className="text-[11px] text-[#8f96b2]">Members</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleJoin(group.id)}
                    className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                      isJoined
                        ? 'border border-[#e5e8f1] bg-[#f5f7fd] text-[#5b6384]'
                        : 'bg-[#e21849] text-white shadow-sm hover:bg-[#c9143f]'
                    }`}
                  >
                    {isJoined ? '✓ Joined' : '+ Join Group'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e5e8f1] bg-white p-8 text-center text-sm text-[#5b6384]">
          {groups.length
            ? 'No groups match the current tab or search. Try a different keyword or switch tabs.'
            : 'No groups are available yet. Create the first learning group to start the community.'}
        </div>
      )}
    </div>
  );
};

export default Groups;
