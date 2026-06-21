import { NavLink } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext.jsx';

export default function SidebarNav() {
  const { stats } = useProgress();
  const topics = stats?.byTopic || [];

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="card sticky top-20 p-3">
        <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Topics
        </h2>
        <nav className="space-y-1">
          {topics.map((t) => {
            const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
            return (
              <NavLink
                key={t.topicId}
                to={`/topics/${t.topicId}`}
                className={({ isActive }) =>
                  `block rounded-lg px-2 py-1.5 text-sm ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <div className="flex justify-between">
                  <span className="truncate">{t.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-slate-400">
                    {t.solved}/{t.total}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
