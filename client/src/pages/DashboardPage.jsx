import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProgressTracker from '../components/ProgressTracker.jsx';

export default function DashboardPage() {
  const { stats, loading } = useProgress();
  const { user } = useAuth();

  if (loading || !stats) {
    return <p className="text-slate-400">Loading your progress…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome back, {user?.displayName || 'Student'} <span className="align-middle">👋</span>
      </h1>

      <ProgressTracker
        percent={stats.percentComplete}
        solved={stats.totalSolved}
        total={stats.totalProblems}
        byDifficulty={stats.byDifficulty}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Progress by topic</h2>
          <Link to="/topics" className="text-sm text-indigo-600 hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.byTopic.map((t) => {
            const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
            return (
              <Link
                key={t.topicId}
                to={`/topics/${t.topicId}`}
                className="card p-4 transition hover:border-indigo-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm text-slate-400">
                    {t.solved}/{t.total}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
