import { useEffect, useState } from 'react';
import {
  CalendarPlus, Download, History, Info, Link2, ListChecks, Mail, Plus, Trash2, TriangleAlert, User, X,
} from 'lucide-react';
import CompanyAvatar from './CompanyAvatar';
import {
  JOB_TYPES, PRIORITIES, STATUSES, WORK_MODES, statusOf, toInputDate,
} from '../lib/constants';
import { useApplications, useDeleteApplication, useSaveApplication } from '../lib/useApplications';
import { downloadIcs, googleCalendarUrl } from '../lib/calendar';

const empty = {
  company: '', role: '', status: 'wishlist', priority: 'medium', jobType: 'internship', workMode: '',
  location: '', jobUrl: '', salary: '', notes: '',
  appliedDate: '', followUpDate: '', interviewDate: '',
  contactName: '', contactEmail: '', contactLinkedin: '',
  tasks: [],
};
const DATE_FIELDS = ['appliedDate', 'followUpDate', 'interviewDate'];
const FIELDS = Object.keys(empty);

function Field({ label, className = '', children }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Timeline({ app }) {
  const history = app.history?.length
    ? app.history
    : [{ status: app.status, at: app.createdAt }]; // older records created before history existed

  return (
    <ol className="relative ml-2 border-l-2 border-slate-100 py-1">
      {[...history].reverse().map((h, i) => {
        const s = statusOf(h.status);
        return (
          <li key={i} className="relative mb-5 ml-6 last:mb-0">
            <span className={`absolute top-1 -left-[31px] h-3.5 w-3.5 rounded-full ring-4 ring-white ${s.color}`} />
            <p className="text-sm font-semibold text-slate-800">
              {s.emoji} {i === history.length - 1 ? 'Added as' : 'Moved to'} {s.label}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(h.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const TASK_IDEAS = ['Tailor resume', 'Write cover letter', 'Ask for referral', 'Research the company', 'Prepare for interview', 'Send thank-you note'];

function Checklist({ tasks, onChange }) {
  const [text, setText] = useState('');
  const done = tasks.filter((t) => t.done).length;

  const add = (value) => {
    const t = value.trim();
    if (!t || tasks.some((x) => x.text.toLowerCase() === t.toLowerCase())) return;
    onChange([...tasks, { text: t, done: false }]);
    setText('');
  };
  const update = (i, patch) => onChange(tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const remove = (i) => onChange(tasks.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {tasks.length > 0 && (
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span>{done}/{tasks.length} done</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} />
          </div>
        </div>
      )}

      <ul className="space-y-1.5">
        {tasks.map((t, i) => (
          <li key={t._id || i} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => update(i, { done: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-indigo-600"
              aria-label={`Mark "${t.text}" as done`}
            />
            <span className={`flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.text}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-600 focus:opacity-100" title="Remove">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Add a step, e.g. Revise DSA – graphs"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // don't submit the whole form
              add(text);
            }
          }}
        />
        <button type="button" onClick={() => add(text)} className="btn-ghost shrink-0 ring-1 ring-slate-200" title="Add task">
          <Plus size={16} />
        </button>
      </div>

      {TASK_IDEAS.some((idea) => !tasks.some((t) => t.text === idea)) && (
        <div>
          <p className="mb-1.5 text-xs text-slate-400">Quick add</p>
          <div className="flex flex-wrap gap-1.5">
            {TASK_IDEAS.filter((idea) => !tasks.some((t) => t.text === idea)).map((idea) => (
              <button key={idea} type="button" onClick={() => add(idea)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
                + {idea}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationModal({ app, defaultStatus, onClose }) {
  const isEdit = !!app?._id;
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(() => {
    if (!app) return { ...empty, status: defaultStatus || 'wishlist' };
    const f = { ...empty };
    FIELDS.forEach((k) => (f[k] = app[k] ?? empty[k]));
    DATE_FIELDS.forEach((k) => (f[k] = toInputDate(app[k])));
    return f;
  });
  const save = useSaveApplication();
  const del = useDeleteApplication();
  const { data: allApps = [] } = useApplications();

  const norm = (v) => v.trim().toLowerCase();
  const duplicate =
    form.company.trim() && form.role.trim()
      ? allApps.find(
          (a) => a._id !== app?._id && norm(a.company) === norm(form.company) && norm(a.role) === norm(form.role)
        )
      : null;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // Fields live in different tabs, so validate manually and jump to the tab with the problem
    const bad = e.currentTarget.querySelector(':invalid');
    if (bad) {
      setTab(bad.name.startsWith('contact') ? 'contact' : 'details');
      setTimeout(() => bad.reportValidity());
      return;
    }
    const payload = { ...form, _id: app?._id };
    DATE_FIELDS.forEach((k) => (payload[k] = form[k] || null));
    save.mutate(payload, { onSuccess: onClose });
  };

  const onDelete = () => {
    if (confirm(`Delete ${app.company} – ${app.role}?`)) del.mutate(app._id, { onSuccess: onClose });
  };

  const TABS = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'tasks', label: `Checklist${form.tasks.length ? ` ${form.tasks.filter((t) => t.done).length}/${form.tasks.length}` : ''}`, icon: ListChecks },
    { id: 'contact', label: 'Contact', icon: User },
    ...(isEdit ? [{ id: 'history', label: 'Timeline', icon: History }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form
        onSubmit={onSubmit}
        noValidate
        onMouseDown={(e) => e.stopPropagation()}
        className="card animate-pop flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 pt-5 pb-4">
          {isEdit && <CompanyAvatar name={form.company} size="h-10 w-10" />}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">
              {isEdit ? `${app.company}` : 'New application'}
            </h2>
            {isEdit && <p className="truncate text-sm text-slate-500">{app.role}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost ml-auto p-1.5"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {/* Details tab (kept mounted so required fields still validate) */}
          <div className={tab === 'details' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'hidden'}>
            <Field label="Company *">
              <input name="company" className="input" value={form.company} onChange={onChange} required autoFocus />
            </Field>
            <Field label="Role *">
              <input name="role" className="input" value={form.role} onChange={onChange} required />
            </Field>
            {duplicate && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200 sm:col-span-2">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                You already track {duplicate.company} – {duplicate.role} (in {statusOf(duplicate.status).label}). You can still save if this is a separate opening.
              </p>
            )}
            <Field label="Status">
              <select name="status" className="input" value={form.status} onChange={onChange}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.id })}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold ring-1 transition ${
                      form.priority === p.id ? p.badge + ' ring-2' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${p.dot}`} /> {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Job type">
              <select name="jobType" className="input" value={form.jobType} onChange={onChange}>
                {JOB_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Work mode">
              <select name="workMode" className="input" value={form.workMode} onChange={onChange}>
                {WORK_MODES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input name="location" className="input" placeholder="Bangalore" value={form.location} onChange={onChange} />
            </Field>
            <Field label="Stipend / Salary">
              <input name="salary" className="input" placeholder="₹30k/month" value={form.salary} onChange={onChange} />
            </Field>
            <Field label="Job URL" className="sm:col-span-2">
              <input name="jobUrl" type="url" className="input" placeholder="https://…" value={form.jobUrl} onChange={onChange} />
            </Field>
            <Field label="Applied on">
              <input name="appliedDate" type="date" className="input" value={form.appliedDate} onChange={onChange} />
            </Field>
            <Field label="Interview on">
              <div className="flex gap-2">
                <input name="interviewDate" type="date" className="input" value={form.interviewDate} onChange={onChange} />
                {form.interviewDate && form.company && (
                  <>
                    <a
                      href={googleCalendarUrl(form, form.interviewDate)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost shrink-0 px-2.5 ring-1 ring-slate-200"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcs({ ...form, _id: app?._id }, form.interviewDate)}
                      className="btn-ghost shrink-0 px-2.5 ring-1 ring-slate-200"
                      title="Download .ics (Apple / Outlook calendar)"
                    >
                      <Download size={16} />
                    </button>
                  </>
                )}
              </div>
            </Field>
            <Field label="Follow-up reminder">
              <input name="followUpDate" type="date" className="input" value={form.followUpDate} onChange={onChange} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea name="notes" rows={3} className="input" placeholder="Interview rounds, prep topics, questions asked…" value={form.notes} onChange={onChange} />
            </Field>
          </div>

          {/* Checklist tab */}
          {tab === 'tasks' && <Checklist tasks={form.tasks} onChange={(tasks) => setForm({ ...form, tasks })} />}

          {/* Contact tab */}
          <div className={tab === 'contact' ? 'space-y-4' : 'hidden'}>
            <p className="text-sm text-slate-500">Who's your point of contact for this role? (recruiter, referrer, hiring manager)</p>
            <Field label="Name">
              <input name="contactName" className="input" placeholder="Ananya Gupta" value={form.contactName} onChange={onChange} />
            </Field>
            <Field label="Email">
              <div className="flex gap-2">
                <input name="contactEmail" type="email" className="input" placeholder="recruiter@company.com" value={form.contactEmail} onChange={onChange} />
                {form.contactEmail && (
                  <a href={`mailto:${form.contactEmail}`} className="btn-ghost shrink-0 ring-1 ring-slate-200" title="Send email"><Mail size={16} /></a>
                )}
              </div>
            </Field>
            <Field label="LinkedIn profile">
              <div className="flex gap-2">
                <input name="contactLinkedin" type="url" className="input" placeholder="https://linkedin.com/in/…" value={form.contactLinkedin} onChange={onChange} />
                {form.contactLinkedin && (
                  <a href={form.contactLinkedin} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 ring-1 ring-slate-200" title="Open LinkedIn"><Link2 size={16} /></a>
                )}
              </div>
            </Field>
          </div>

          {/* Timeline tab */}
          {tab === 'history' && isEdit && <Timeline app={app} />}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          {isEdit && (
            <button type="button" onClick={onDelete} className="btn-danger" disabled={del.isPending}>
              <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost ml-auto">Cancel</button>
          <button className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add application'}
          </button>
        </div>
      </form>
    </div>
  );
}
