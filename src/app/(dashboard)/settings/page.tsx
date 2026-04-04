'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, Plus, Users, Building2, User } from 'lucide-react';

type Tab = 'organization' | 'members' | 'profile';

type OrgData = { id: string; name: string; slug: string } | null;
type Member = { id: string; full_name: string; email: string; role: string };

function SaveFeedback({ saved, error }: { saved: boolean; error: string | null }) {
  if (error)
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
        {error}
      </div>
    );
  if (saved)
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
        <CheckCircle size={14} /> Changes saved successfully
      </div>
    );
  return null;
}

function OrgTab({ org }: { org: OrgData }) {
  const [name, setName] = useState(org?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/orgs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <SaveFeedback saved={saved} error={error} />
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization Slug
          </label>
          <input
            type="text"
            value={org?.slug ?? ''}
            readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            Slug is assigned at creation and cannot be changed.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function MembersTab({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(true);
      setInviteEmail('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-700',
    manager: 'bg-purple-100 text-purple-700',
    employee: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">{members.length} Members</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                {m.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) ?? '??'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{m.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${roleColors[m.role] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {m.role}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">No members yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite a Team Member</h3>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <CheckCircle size={14} /> Invite sent successfully!
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'manager' | 'employee')}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Send Invite
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileTab() {
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.full_name) setFullName(data.full_name);
          });
      }
    });
  }, []);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameError(null);
    setNameSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 4000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePwChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    setPwError(null);
    setPwSaved(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPwSaved(false), 4000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
        <SaveFeedback saved={nameSaved} error={nameError} />
        <form onSubmit={handleNameSave} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          <button
            type="submit"
            disabled={nameLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {nameLoading && <Loader2 size={14} className="animate-spin" />}
            {nameLoading ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
        <SaveFeedback saved={pwSaved} error={pwError} />
        <form onSubmit={handlePwChange} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {pwLoading && <Loader2 size={14} className="animate-spin" />}
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('organization');
  const [org, setOrg] = useState<OrgData>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()
        .then(({ data: userData }) => {
          if (!userData?.org_id) return;
          supabase
            .from('orgs')
            .select('id, name, slug')
            .eq('id', userData.org_id)
            .single()
            .then(({ data }) => setOrg(data));
          supabase
            .from('users')
            .select('id, full_name, email, role')
            .eq('org_id', userData.org_id)
            .order('full_name')
            .then(({ data }) => setMembers(data ?? []));
        });
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization and account preferences</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === 'organization' && <OrgTab org={org} />}
        {tab === 'members' && <MembersTab initialMembers={members} />}
        {tab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}