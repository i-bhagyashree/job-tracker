import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Briefcase, KanbanSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Board', icon: KanbanSquare, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
        <Briefcase size={18} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Job<span className="text-indigo-400">Trackr</span>
      </span>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 p-5 text-white lg:flex">
        <Logo />
        <nav className="mt-10 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold">Keep going! 💪</p>
          <p className="mt-1 text-xs text-slate-400">Consistency wins. Apply to a few roles every day.</p>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500 text-sm font-semibold">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Top bar (mobile / tablet) */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-slate-900 px-4 text-white lg:hidden">
        <Logo />
        <nav className="ml-auto flex gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `rounded-lg p-2 ${isActive ? 'bg-white/15 text-white' : 'text-slate-400'}`
              }
            >
              <Icon size={18} />
            </NavLink>
          ))}
          <button onClick={logout} className="rounded-lg p-2 text-slate-400" title="Log out">
            <LogOut size={18} />
          </button>
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
