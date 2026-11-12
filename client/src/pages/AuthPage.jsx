import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, BellRing, Briefcase, KanbanSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';

const FEATURES = [
  { icon: KanbanSquare, title: 'Visual Kanban board', text: 'Drag applications from Wishlist to Offer.' },
  { icon: BellRing, title: 'Follow-up reminders', text: 'Never forget to ping a recruiter again.' },
  { icon: BarChart3, title: 'Progress analytics', text: 'See your response and interview rates.' },
];

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await (isLogin ? login(form) : register(form));
      navigate('/');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <Briefcase size={20} />
          </span>
          <span className="text-xl font-bold">Job<span className="text-indigo-400">Trackr</span></span>
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl leading-tight font-extrabold">
            Land your dream internship,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">one application at a time.</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icon size={18} className="text-indigo-300" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} JobTrackr</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
              <Briefcase size={20} />
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isLogin ? 'Welcome back 👋' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin ? 'Log in to continue tracking your applications.' : 'Start organising your job hunt in seconds.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {!isLogin && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" name="name" className="input" placeholder="Priya Sharma" value={form.name} onChange={onChange} required />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={onChange} required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength={6} className="input" placeholder="At least 6 characters" value={form.password} onChange={onChange} required />
            </div>
            <button className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-indigo-600 hover:underline">
              {isLogin ? 'Sign up free' : 'Log in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
