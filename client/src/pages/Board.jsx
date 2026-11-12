import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Download, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import KanbanColumn from '../components/KanbanColumn';
import ApplicationModal from '../components/ApplicationModal';
import { CardContent } from '../components/ApplicationCard';
import { JOB_TYPES, PRIORITIES, STATUSES, WORK_MODES, priorityOf } from '../lib/constants';
import { exportCsv } from '../lib/exportCsv';
import { useApplications, useReorder } from '../lib/useApplications';

const SORTS = {
  custom: { label: 'Custom order', fn: null },
  newest: { label: 'Recently updated', fn: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) },
  priority: { label: 'Priority', fn: (a, b) => priorityOf(a.priority).rank - priorityOf(b.priority).rank },
  interview: {
    label: 'Interview date',
    fn: (a, b) => (a.interviewDate ? new Date(a.interviewDate) : Infinity) - (b.interviewDate ? new Date(b.interviewDate) : Infinity),
  },
  company: { label: 'Company A–Z', fn: (a, b) => a.company.localeCompare(b.company) },
};

const chip = (active) =>
  `rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
    active ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
  }`;

export default function Board() {
  const { data = [], isLoading, isError, refetch } = useApplications();
  const reorder = useReorder();

  const [dragItems, setDragItems] = useState(null); // local copy while dragging
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [sort, setSort] = useState('custom');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null); // { app } or { defaultStatus }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // allows click vs drag
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Keyboard shortcut: "n" opens the new-application form
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.key === 'n' && !typing && !modal && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setModal({ defaultStatus: 'wishlist' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const items = dragItems ?? data;
  const query = search.trim().toLowerCase();
  const filterCount = [priority, jobType, workMode].filter(Boolean).length;
  const dragPaused = !!query || filterCount > 0 || sort !== 'custom';

  const visible = useMemo(() => {
    let list = items.filter(
      (a) =>
        (!query || [a.company, a.role, a.location, a.notes].some((f) => f?.toLowerCase().includes(query))) &&
        (!priority || a.priority === priority) &&
        (!jobType || a.jobType === jobType) &&
        (!workMode || a.workMode === workMode)
    );
    if (SORTS[sort].fn) list = [...list].sort(SORTS[sort].fn);
    return list;
  }, [items, query, priority, jobType, workMode, sort]);

  const activeApp = items.find((a) => a._id === activeId);

  const clearAll = () => {
    setSearch(''); setPriority(''); setJobType(''); setWorkMode(''); setSort('custom');
  };

  const onExport = () => {
    if (!visible.length) return toast.error('Nothing to export');
    exportCsv(visible);
    toast.success(`Exported ${visible.length} application${visible.length > 1 ? 's' : ''}`);
  };

  const onDragStart = ({ active }) => {
    setActiveId(active.id);
    setDragItems(data);
  };

  // Moving across columns: update status live so the card shows in the new column
  const onDragOver = ({ active, over }) => {
    if (!over) return;
    setDragItems((prev) => {
      const current = prev.find((a) => a._id === active.id);
      const overIsColumn = over.data.current?.type === 'column';
      const overStatus = overIsColumn ? over.id : prev.find((a) => a._id === over.id)?.status;
      if (!current || !overStatus || current.status === overStatus) return prev;

      const rest = prev.filter((a) => a._id !== active.id);
      const index = overIsColumn ? rest.length : rest.findIndex((a) => a._id === over.id);
      rest.splice(index, 0, { ...current, status: overStatus });
      return rest;
    });
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    let list = dragItems;

    if (over && active.id !== over.id && over.data.current?.type !== 'column') {
      const from = list.findIndex((a) => a._id === active.id);
      const to = list.findIndex((a) => a._id === over.id);
      if (list[from].status === list[to].status) list = arrayMove(list, from, to);
    }

    // Re-number order within each column
    const counters = {};
    list = list.map((a) => ({ ...a, order: (counters[a.status] = (counters[a.status] ?? -1) + 1) }));

    const changed = list.filter((a) => {
      const orig = data.find((d) => d._id === a._id);
      return orig.status !== a.status || orig.order !== a.order;
    });
    if (!changed.length) return setDragItems(null);

    const moved = list.find((a) => a._id === active.id);
    const before = data.find((a) => a._id === active.id);
    if (moved.status !== before.status) {
      toast.success(`${moved.company} → ${STATUSES.find((s) => s.id === moved.status).label}`);
    }

    setDragItems(list);
    reorder.mutate(list, { onSettled: () => setDragItems(null) });
  };

  const onDragCancel = () => {
    setActiveId(null);
    setDragItems(null);
  };

  if (isError)
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Couldn't load your applications.</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag cards between columns to update their status · press{' '}
            <kbd className="rounded border border-slate-300 bg-white px-1.5 font-mono text-xs">N</kbd> to add
          </p>
        </div>
        <div className="flex gap-2 md:ml-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search company, role, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn relative shrink-0 ring-1 ${showFilters || filterCount ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
            title="Filters & sorting"
          >
            <SlidersHorizontal size={16} /> <span className="hidden lg:inline">Filters</span>
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-[10px] text-white">{filterCount}</span>
            )}
          </button>
          <button onClick={onExport} className="btn shrink-0 bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" title="Export to CSV">
            <Download size={16} /> <span className="hidden lg:inline">Export</span>
          </button>
          <button className="btn-primary shrink-0" onClick={() => setModal({ defaultStatus: 'wishlist' })}>
            <Plus size={16} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card animate-pop mb-6 grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="label">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              <button className={chip(!priority)} onClick={() => setPriority('')}>All</button>
              {PRIORITIES.map((p) => (
                <button key={p.id} className={chip(priority === p.id)} onClick={() => setPriority(p.id)}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Job type</p>
            <div className="flex flex-wrap gap-1.5">
              <button className={chip(!jobType)} onClick={() => setJobType('')}>All</button>
              {JOB_TYPES.map((t) => (
                <button key={t.id} className={chip(jobType === t.id)} onClick={() => setJobType(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Work mode</p>
            <div className="flex flex-wrap gap-1.5">
              <button className={chip(!workMode)} onClick={() => setWorkMode('')}>All</button>
              {WORK_MODES.filter((m) => m.id).map((m) => (
                <button key={m.id} className={chip(workMode === m.id)} onClick={() => setWorkMode(m.id)}>{m.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Sort cards by</p>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: data.length, cls: 'from-indigo-500 to-violet-500' },
          { label: 'Active', value: data.filter((a) => ['applied', 'interview'].includes(a.status)).length, cls: 'from-sky-500 to-blue-500' },
          { label: 'Interviews', value: data.filter((a) => a.status === 'interview').length, cls: 'from-amber-500 to-orange-500' },
          { label: 'Offers', value: data.filter((a) => a.status === 'offer').length, cls: 'from-emerald-500 to-teal-500' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.cls} p-4 text-white shadow-md`}>
            <p className="text-xs font-medium tracking-wide uppercase opacity-80">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {dragPaused && (
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          Showing {visible.length} of {data.length} · drag & drop is paused while searching, filtering or sorting.
          <button onClick={clearAll} className="font-semibold text-indigo-600 hover:underline">Clear all</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {STATUSES.map((s) => (
            <div key={s.id} className="h-96 w-[280px] shrink-0 animate-pulse rounded-2xl bg-slate-200/70 xl:flex-1" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="scroll-thin -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                apps={visible.filter((a) => a.status === status.id)}
                onCardClick={(app) => setModal({ app })}
                onAdd={(id) => setModal({ defaultStatus: id })}
                dragDisabled={dragPaused}
              />
            ))}
          </div>
          <DragOverlay>{activeApp && <CardContent app={activeApp} dragging />}</DragOverlay>
        </DndContext>
      )}

      {!isLoading && data.length === 0 && (
        <div className="card mt-2 p-8 text-center">
          <p className="text-4xl">🚀</p>
          <p className="mt-2 font-semibold text-slate-800">No applications yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the first job you're interested in to get started.</p>
          <button className="btn-primary mt-4" onClick={() => setModal({ defaultStatus: 'wishlist' })}>
            <Plus size={16} /> Add application
          </button>
        </div>
      )}

      {modal && (
        <ApplicationModal app={modal.app} defaultStatus={modal.defaultStatus} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
