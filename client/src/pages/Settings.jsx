import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Target, TriangleAlert, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';

function Section({ icon: Icon, title, description, children, danger }) {
  return (
    <section className={`card p-6 ${danger ? 'border-rose-200' : ''}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${danger ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user?.name || '', weeklyGoal: user?.weeklyGoal ?? 5 });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [deletePw, setDeletePw] = useState('');
  const [busy, setBusy] = useState('');

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setBusy('');
    }
  };

  const onProfile = (e) => {
    e.preventDefault();
    run('profile', () => updateProfile({ name: profile.name, weeklyGoal: Number(profile.weeklyGoal) }), 'Profile saved');
  };

  const onPassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("New passwords don't match");
    const ok = await run('password', () => changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }), 'Password changed');
    if (ok) setPw({ currentPassword: '', newPassword: '', confirm: '' });
  };

  const onDelete = async (e) => {
    e.preventDefault();
    if (!confirm('This permanently deletes your account and every application. Continue?')) return;
    const ok = await run('delete', () => deleteAccount(deletePw), 'Account deleted');
    if (ok) {
      qc.clear();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and account</p>
      </div>

      <Section icon={UserRound} title="Profile & goal" description={`Signed in as ${user?.email}`}>
        <form onSubmit={onProfile} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" minLength={2} required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="goal">
              <Target size={12} className="mr-1 inline" />Weekly application goal
            </label>
            <input id="goal" type="number" min={0} max={100} className="input" value={profile.weeklyGoal} onChange={(e) => setProfile({ ...profile, weeklyGoal: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </Section>

      <Section icon={KeyRound} title="Change password" description="Use at least 6 characters.">
        <form onSubmit={onPassword} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="cur">Current password</label>
            <input id="cur" type="password" autoComplete="current-password" required className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="new">New password</label>
            <input id="new" type="password" autoComplete="new-password" minLength={6} required className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" minLength={6} required className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy === 'password'}>{busy === 'password' ? 'Updating…' : 'Update password'}</button>
          </div>
        </form>
      </Section>

      <Section icon={TriangleAlert} title="Delete account" description="Permanently removes your account and all your applications. This can't be undone." danger>
        <form onSubmit={onDelete} className="flex flex-col gap-3 sm:flex-row">
          <input type="password" required placeholder="Enter your password to confirm" className="input" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} autoComplete="current-password" />
          <button className="btn shrink-0 bg-rose-600 text-white hover:bg-rose-500" disabled={busy === 'delete'}>
            {busy === 'delete' ? 'Deleting…' : 'Delete account'}
          </button>
        </form>
      </Section>
    </div>
  );
}
