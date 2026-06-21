import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext.jsx';

export default function TopicsPage() {
  const { topics, stats, loading } = useProgress();
  const solvedByTopic = new Map((stats?.byTopic || []).map((t) => [t.topicId, t.solved]));

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Topics</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => {
          const solved = solvedByTopic.get(t.id) || 0;
          const total = t.problemCount;
          const pct = total ? Math.round((solved / total) * 100) : 0;
          return (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              className="card p-4 transition hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="text-sm text-slate-400">
                  {solved}/{total}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{t.description}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
