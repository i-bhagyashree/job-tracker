import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MapPin, Plus, Search, Sparkles } from 'lucide-react';
import { useSaveApplication } from '../lib/useApplications';
import { internshalaUrl, linkedinUrl } from '../lib/jobSearch';

const POPULAR = [
  'Web Development', 'Front End Developer', 'Data Science', 'Python', 'Java',
  'Machine Learning', 'UI/UX Design', 'Android App Development', 'Digital Marketing', 'Content Writing',
];
const CITIES = ['Bangalore', 'Pune', 'Hyderabad', 'Delhi', 'Mumbai', 'Indore', 'Jaipur', 'Chennai'];

const EMPTY_SAVE = { company: '', role: '', jobUrl: '' };

function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
      {children}
    </label>
  );
}

function SiteCard({ name, tagline, href, accent, logo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold text-white ${accent}`}>{logo}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">Search on {name}</p>
        <p className="truncate text-sm text-slate-500">{tagline}</p>
      </div>
      <ExternalLink size={18} className="shrink-0 text-slate-400 transition group-hover:text-indigo-600" />
    </a>
  );
}

export default function FindJobs() {
  const [query, setQuery] = useState({ keyword: '', location: '', type: 'internship', remote: false, recent: true });
  const [saveForm, setSaveForm] = useState(EMPTY_SAVE);
  const save = useSaveApplication();

  const set = (k) => (v) => setQuery((q) => ({ ...q, [k]: v }));
  const label = query.type === 'internship' ? 'internships' : 'jobs';
  const where = query.remote ? 'work from home' : query.location.trim() ? `in ${query.location.trim()}` : 'across India';
  const what = query.keyword.trim() || 'all';

  const onSave = (e) => {
    e.preventDefault();
    save.mutate(
      {
        ...saveForm,
        status: 'wishlist',
        jobType: query.type === 'internship' ? 'internship' : 'full-time',
        ...(query.remote && { workMode: 'remote' }),
      },
      { onSuccess: () => setSaveForm(EMPTY_SAVE) },
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Find Jobs & Internships</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search Internshala and LinkedIn in one click, then save the roles you like to your board.
      </p>

      {/* Search form */}
      <div className="card mt-6 space-y-5 p-5">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {[
            ['internship', 'Internships'],
            ['job', 'Jobs'],
          ].map(([id, text]) => (
            <button
              key={id}
              type="button"
              onClick={() => set('type')(id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                query.type === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="kw">Role or skill</label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                id="kw"
                className="input pl-9"
                placeholder="e.g. Web Development, Python"
                value={query.keyword}
                onChange={(e) => set('keyword')(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="loc">City</label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                id="loc"
                className="input pl-9 disabled:opacity-50"
                placeholder="Any city in India"
                list="cities"
                disabled={query.remote}
                value={query.location}
                onChange={(e) => set('location')(e.target.value)}
              />
              <datalist id="cities">
                {CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Toggle checked={query.remote} onChange={set('remote')}>Work from home only</Toggle>
          <Toggle checked={query.recent} onChange={set('recent')}>Posted in the last week (LinkedIn)</Toggle>
        </div>

        <div>
          <p className="label flex items-center gap-1.5"><Sparkles size={14} /> Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set('keyword')(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  query.keyword === p
                    ? 'bg-indigo-600 text-white ring-indigo-600'
                    : 'bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Destinations */}
      <p className="mt-6 mb-3 text-sm text-slate-500">
        Showing <span className="font-medium text-slate-800">{what}</span> {label}{' '}
        <span className="font-medium text-slate-800">{where}</span>. Opens in a new tab.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <SiteCard
          name="Internshala"
          tagline={`Student ${label} across India`}
          href={internshalaUrl(query)}
          accent="bg-gradient-to-br from-sky-500 to-cyan-400"
          logo="IS"
        />
        <SiteCard
          name="LinkedIn"
          tagline={query.type === 'internship' ? 'Internships at companies worldwide' : 'Entry-level jobs from top companies'}
          href={linkedinUrl(query)}
          accent="bg-gradient-to-br from-blue-700 to-blue-500"
          logo="in"
        />
      </div>
      {query.location.trim() && !query.remote && query.keyword.trim() && (
        <p className="mt-2 text-xs text-slate-400">
          Tip: Internshala's city pages work best with common categories like "Web Development" or "Data Science".
        </p>
      )}

      {/* Quick save */}
      <form onSubmit={onSave} className="card mt-8 p-5">
        <p className="font-semibold text-slate-900">Found something you like?</p>
        <p className="mt-0.5 text-sm text-slate-500">
          Save it to your <Link to="/" className="font-medium text-indigo-600 hover:underline">Wishlist</Link> so you remember to apply.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
          <input
            className="input"
            placeholder="Company *"
            required
            value={saveForm.company}
            onChange={(e) => setSaveForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Role *"
            required
            value={saveForm.role}
            onChange={(e) => setSaveForm((f) => ({ ...f, role: e.target.value }))}
          />
          <input
            className="input"
            type="url"
            placeholder="Paste job link (optional)"
            value={saveForm.jobUrl}
            onChange={(e) => setSaveForm((f) => ({ ...f, jobUrl: e.target.value }))}
          />
          <button type="submit" disabled={save.isPending} className="btn-primary justify-center">
            <Plus size={16} /> {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
