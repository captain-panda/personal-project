import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProblemCard from '../components/ProblemCard.jsx';

const FILTERS = ['All', 'Easy', 'Medium', 'Hard'];

export default function ProblemsPage() {
  const { topicId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    api
      .get(`/api/topics/${topicId}/problems`)
      .then((r) => active && setData(r.data))
      .catch((e) => active && setError(e.response?.data?.error?.message || 'Failed to load problems'));
    return () => {
      active = false;
    };
  }, [topicId]);

  // Client-side search/filter over the loaded sheet (no extra API calls).
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.problems.filter(
      (p) =>
        (difficulty === 'All' || p.difficulty === difficulty) &&
        (q === '' ||
          p.title.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))),
    );
  }, [data, query, difficulty]);

  if (error) return <p className="text-rose-500">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/topics" className="text-sm text-indigo-600 hover:underline">
          ← Topics
        </Link>
        <h1 className="text-2xl font-bold">{data.topic.name}</h1>
        {data.topic.description && (
          <p className="text-sm text-slate-400">{data.topic.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input sm:max-w-xs"
          placeholder="Search problems or tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1">
          {FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`btn ${
                difficulty === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
        {filtered.length === 0 && <p className="text-slate-400">No problems match your filters.</p>}
      </div>
    </div>
  );
}
