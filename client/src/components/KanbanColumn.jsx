import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import ApplicationCard from './ApplicationCard';

export default function KanbanColumn({ status, apps, onCardClick, onAdd, dragDisabled }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id, data: { type: 'column' } });

  return (
    <section className="flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100/70 xl:w-auto xl:min-w-0 xl:flex-1">
      <div className={`h-1 bg-gradient-to-r ${status.bar}`} />
      <header className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <span className="text-base">{status.emoji}</span>
        <h2 className="text-sm font-semibold text-slate-800">{status.label}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-xs">
          {apps.length}
        </span>
        <button
          onClick={() => onAdd(status.id)}
          className="ml-auto rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm"
          title={`Add to ${status.label}`}
        >
          <Plus size={16} />
        </button>
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-1 flex-col gap-2.5 p-2.5 transition-colors ${
          isOver ? 'bg-indigo-100/60' : ''
        }`}
      >
        <SortableContext items={apps.map((a) => a._id)} strategy={verticalListSortingStrategy}>
          {apps.map((app) => (
            <ApplicationCard key={app._id} app={app} disabled={dragDisabled} onClick={() => onCardClick(app)} />
          ))}
        </SortableContext>
        {apps.length === 0 && (
          <button
            onClick={() => onAdd(status.id)}
            className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300/80 py-8 text-xs text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"
          >
            <Plus size={18} className="mb-1" />
            Drop here or add
          </button>
        )}
      </div>
    </section>
  );
}
