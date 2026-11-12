import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  BellRing, Briefcase, Hourglass, MessageSquareReply, Mic, Target, TriangleAlert, Trophy, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STALE_DAYS, STATUSES, formatDate, relativeDay } from '../lib/constants';
import CompanyAvatar from '../components/CompanyAvatar';
import { useStats } from '../lib/useApplications';

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-lg ${accent}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function UpcomingList({ title, icon: Icon, items, dateKey, badge, empty }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon size={16} /> {title}
      </h2>
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a._id} className="flex items-center gap-3 py-2.5 text-sm">
              <CompanyAvatar name={a.company} size="h-8 w-8 text-xs" />
              <span className="min-w-0 flex-1 truncate">
                <b>{a.company}</b> <span className="text-slate-500">· {a.role}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`} title={formatDate(a[dateKey])}>
                {relativeDay(a[dateKey])}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{empty}</p>
      )}
    </div>
  );
}

function WeeklyGoal({ done, goal }) {
  const pct = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const reached = goal > 0 && done >= goal;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-700">This week's goal</h2>
        <Link to="/settings" className="ml-auto text-xs font-medium text-indigo-600 hover:underline">Change</Link>
      </div>
      {goal ? (
        <>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {done}<span className="text-lg font-medium text-slate-400"> / {goal} applications</span>
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${reached ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {reached ? '🎉 Goal reached — great consistency!' : `${goal - done} more to hit your goal (week starts Monday).`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No goal set. Set a weekly target in Settings to stay consistent.</p>
      )}
    </div>
  );
}

function NeedsAttention({ items }) {
  return (
    <div className="card p-5 lg:col-span-2">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <TriangleAlert size={16} className="text-orange-500" /> Needs attention
        {items.length > 0 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{items.length}</span>}
      </h2>
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={`${a.reason}-${a._id}`} className="flex items-center gap-3 py-2.5 text-sm">
              <CompanyAvatar name={a.company} size="h-8 w-8 text-xs" />
              <span className="min-w-0 flex-1 truncate">
                <b>{a.company}</b> <span className="text-slate-500">· {a.role}</span>
              </span>
              {a.reason === 'followup' ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700" title={formatDate(a.since)}>
                  <BellRing size={11} /> Follow-up {relativeDay(a.since).toLowerCase()}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700" title={`Applied / last moved ${formatDate(a.since)}`}>
                  <Hourglass size={11} /> No reply · {relativeDay(a.since).replace(' ago', '')}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">
          All caught up! Overdue follow-ups and applications with no reply for {STALE_DAYS}+ days show up here.
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useStats();
  const { user } = useAuth();

  if (isLoading || !data)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/70" />)}
      </div>
    );

  const pieData = STATUSES.map((s) => ({ name: s.label, value: data.counts[s.id], fill: s.chart })).filter((d) => d.value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-slate-500">How your job search is going</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Briefcase} label="Total applications" value={data.total} accent="bg-indigo-50 text-indigo-600" />
        <StatTile icon={MessageSquareReply} label="Response rate" value={`${data.responseRate}%`} accent="bg-sky-50 text-sky-600" />
        <StatTile icon={Users} label="Interview rate" value={`${data.interviewRate}%`} accent="bg-amber-50 text-amber-600" />
        <StatTile icon={Trophy} label="Offers" value={data.counts.offer} accent="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyGoal done={data.thisWeek ?? 0} goal={user?.weeklyGoal ?? 0} />
        <NeedsAttention items={data.needsAttention ?? []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Applications per week</h2>
          {data.weekly.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} tickFormatter={(w) => w.split('-')[1]} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
                <Tooltip cursor={{ fill: '#eef2ff' }} />
                <Bar dataKey="count" name="Applications" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">Apply to some jobs to see weekly activity.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Pipeline</h2>
          {pieData.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1.5">
                {STATUSES.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    <span className="text-slate-600">{s.label}</span>
                    <span className="ml-auto font-medium">{data.counts[s.id]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">No data yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingList
          title="Upcoming interviews"
          icon={Mic}
          items={data.upcomingInterviews}
          dateKey="interviewDate"
          badge="bg-violet-50 text-violet-700"
          empty="No interviews scheduled. Add an interview date to an application."
        />
        <UpcomingList
          title="Upcoming follow-ups"
          icon={BellRing}
          items={data.upcomingFollowUps}
          dateKey="followUpDate"
          badge="bg-amber-50 text-amber-700"
          empty="No follow-ups scheduled. Set one when editing an application."
        />
      </div>
    </div>
  );
}
