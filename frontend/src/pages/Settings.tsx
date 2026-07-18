import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, AlertTriangle, LogOut, Bell, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account & Auth', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Globe },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('profile');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { name: name.trim() || undefined, avatar: avatar.trim() || undefined });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="px-6 py-6 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-0 h-full">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 border-r border-white/5 p-4 space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                } ${s.id === 'danger' ? '!text-rose-400 hover:!bg-rose-950/20' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 p-6 max-w-2xl">
          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Profile</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Update your public profile information</p>
              </div>

              {/* Avatar preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {name.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name || user?.email}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Display Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-zinc-900/60 border border-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Avatar URL</label>
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-zinc-900/60 border border-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                  <p className="text-xs text-zinc-600">Enter a URL to an existing image</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Email Address</label>
                  <input
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-zinc-800/40 border border-white/5 text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-600">Email is managed by Supabase Auth. To change it, update via your OAuth provider.</p>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          )}

          {activeSection === 'account' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Account & Auth</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Manage your authentication providers</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Google Account</p>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Connected</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <Mail className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Email & Password</p>
                      <p className="text-xs text-zinc-500">Managed by Supabase</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-700 text-zinc-400 border border-white/5 font-medium">Managed</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 bg-zinc-800/60 text-white text-sm font-medium hover:bg-zinc-700/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Notifications</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Control what alerts you receive</p>
              </div>
              <div className="space-y-3">
                {['AI summary complete', 'Weekly digest', 'New features'].map((label) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Receive notifications when this event occurs</p>
                    </div>
                    <div className="relative h-5 w-9 rounded-full bg-indigo-500 cursor-pointer shrink-0">
                      <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600">Full notification controls coming soon.</p>
            </motion.div>
          )}

          {activeSection === 'preferences' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Preferences</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Customise your ReelVault experience</p>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                  <p className="text-sm font-medium text-white mb-3">Theme</p>
                  <div className="flex gap-3">
                    {['Dark', 'System'].map((t) => (
                      <button key={t} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${t === 'Dark' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">Full theme switching coming soon.</p>
                </div>
                <div className="p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
                  <p className="text-sm font-medium text-white mb-1">Default Reel View</p>
                  <p className="text-xs text-zinc-500 mb-3">Choose how reels are displayed by default</p>
                  <div className="flex gap-3">
                    {['Grid', 'List'].map((v) => (
                      <button key={v} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${v === 'Grid' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'danger' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-rose-400">Danger Zone</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Irreversible actions. Proceed with caution.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-950/10">
                  <div>
                    <p className="text-sm font-semibold text-white">Export All Data</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Download a JSON export of all your reels, tags, and collections.</p>
                  </div>
                  <button
                    onClick={() => toast.info('Data export coming soon.')}
                    className="ml-4 shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium border border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Export
                  </button>
                </div>
                <div className="flex items-start justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-950/10">
                  <div>
                    <p className="text-sm font-semibold text-white">Delete Account</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <button
                    onClick={() => toast.warning('Please contact support to delete your account.')}
                    className="ml-4 shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
