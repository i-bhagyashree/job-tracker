import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BellRing, Calendar, ExternalLink, Hourglass, IndianRupee, ListChecks, MapPin, Mic } from 'lucide-react';
import CompanyAvatar from './CompanyAvatar';
import {
  JOB_TYPES, WORK_MODES, daysUntil, formatDate, isStale, labelOf, lastMoveDate, priorityOf, relativeDay,
} from '../lib/constants';

export function CardContent({ app, onClick, dragging }) {
  const followUpDue = app.followUpDate && daysUntil(app.followUpDate) <= 0;
  const interviewIn = app.interviewDate ? daysUntil(app.interviewDate) : null;
  const showInterview = interviewIn !== null && interviewIn >= 0;
  const priority = priorityOf(app.priority);
  const tasks = app.tasks || [];
  const tasksDone = tasks.filter((t) => t.done).length;
  const stale = isStale(app);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md ${
        dragging ? 'rotate-2 cursor-grabbing shadow-2xl ring-2 ring-indigo-400' : 'cursor-pointer'
      }`}
    >
      <span
        className={`absolute top-3.5 right-3.5 h-2 w-2 rounded-full ${priority.dot}`}
        title={`${priority.label} priority`}
      />
      <div className="flex items-start gap-3 pr-3">
        <CompanyAvatar name={app.company} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate font-semibold text-slate-900">{app.company}</p>
            {app.jobUrl && (
              <a
                href={app.jobUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-indigo-600"
                title="Open job posting"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p className="truncate text-sm text-slate-500">{app.role}</p>
        </div>
      </div>

      {showInterview && (
        <div
          className={`mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
            interviewIn <= 1 ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700'
          }`}
        >
          <Mic size={12} /> Interview {relativeDay(app.interviewDate).toLowerCase()}
          <span className="ml-auto font-normal opacity-80">{formatDate(app.interviewDate)}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {app.jobType && app.jobType !== 'internship' && (
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{labelOf(JOB_TYPES, app.jobType)}</span>
        )}
        {app.workMode && (
          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{labelOf(WORK_MODES, app.workMode)}</span>
        )}
        {app.location && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <MapPin size={11} /> {app.location}
          </span>
        )}
        {tasks.length > 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
              tasksDone === tasks.length ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
            }`}
            title="Checklist progress"
          >
            <ListChecks size={11} /> {tasksDone}/{tasks.length}
          </span>
        )}
        {stale && (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-700" title="No status change for a while — consider following up">
            <Hourglass size={11} /> No reply · {-daysUntil(lastMoveDate(app))}d
          </span>
        )}
        {app.salary && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            <IndianRupee size={11} /> {app.salary.replace(/^₹/, '')}
          </span>
        )}
      </div>

      {(app.appliedDate || app.followUpDate) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400">
          {app.appliedDate ? (
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(app.appliedDate)}</span>
          ) : <span />}
          {app.followUpDate && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                followUpDue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <BellRing size={11} /> {followUpDue ? 'Follow up!' : formatDate(app.followUpDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationCard({ app, onClick, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app._id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
      {...attributes}
      {...listeners}
    >
      <CardContent app={app} onClick={onClick} />
    </div>
  );
}
