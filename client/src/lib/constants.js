export const STATUSES = [
  { id: 'wishlist', label: 'Wishlist', emoji: '⭐', color: 'bg-slate-400', bar: 'from-slate-400 to-slate-300', badge: 'bg-slate-100 text-slate-700', chart: '#94a3b8' },
  { id: 'applied', label: 'Applied', emoji: '📨', color: 'bg-blue-500', bar: 'from-blue-500 to-sky-400', badge: 'bg-blue-50 text-blue-700', chart: '#3b82f6' },
  { id: 'interview', label: 'Interview', emoji: '🎤', color: 'bg-amber-500', bar: 'from-amber-500 to-yellow-400', badge: 'bg-amber-50 text-amber-700', chart: '#f59e0b' },
  { id: 'offer', label: 'Offer', emoji: '🎉', color: 'bg-emerald-500', bar: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-50 text-emerald-700', chart: '#10b981' },
  { id: 'rejected', label: 'Rejected', emoji: '🙅', color: 'bg-rose-500', bar: 'from-rose-500 to-pink-400', badge: 'bg-rose-50 text-rose-700', chart: '#f43f5e' },
];

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

// <input type="date"> needs YYYY-MM-DD
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// Deterministic colourful avatar for each company
const AVATAR_COLORS = [
  'from-indigo-500 to-violet-500', 'from-sky-500 to-cyan-400', 'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400', 'from-rose-500 to-pink-400', 'from-fuchsia-500 to-purple-500',
  'from-blue-600 to-indigo-500', 'from-lime-500 to-green-500',
];
export const avatarColor = (name = '') => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const PRIORITIES = [
  { id: 'high', label: 'High', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-rose-200', rank: 0 },
  { id: 'medium', label: 'Medium', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-amber-200', rank: 1 },
  { id: 'low', label: 'Low', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-600 ring-slate-200', rank: 2 },
];
export const JOB_TYPES = [
  { id: 'internship', label: 'Internship' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
];
export const WORK_MODES = [
  { id: '', label: 'Not specified' },
  { id: 'onsite', label: 'On-site' },
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
];

export const priorityOf = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];
export const statusOf = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
export const labelOf = (list, id) => list.find((x) => x.id === id)?.label || '';

/** Whole days from today until `d` (0 = today, negative = past). */
export const daysUntil = (d) => {
  const start = new Date(new Date().setHours(0, 0, 0, 0));
  const target = new Date(new Date(d).setHours(0, 0, 0, 0));
  return Math.round((target - start) / 86_400_000);
};

export const relativeDay = (d) => {
  const n = daysUntil(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
};

/** Applications sitting in "Applied" this long with no movement get flagged. */
export const STALE_DAYS = 14;

/** Date the application last changed status (falls back for older records). */
export const lastMoveDate = (app) => app.history?.at(-1)?.at || app.appliedDate || app.createdAt;

export const isStale = (app) =>
  app.status === 'applied' && -daysUntil(lastMoveDate(app)) >= STALE_DAYS;
