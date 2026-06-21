import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import { useProgress } from '../context/ProgressContext.jsx';

const LINKS = [
  ['leetcode', 'LeetCode'],
  ['youtube', 'Video Solution'],
  ['codeforces', 'Codeforces'],
  ['article', 'Article'],
];

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const { isDone, toggle } = useProgress();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setProblem(null);
    setError('');
    api
      .get(`/api/problems/${problemId}`)
      .then((r) => active && setProblem(r.data.problem))
      .catch((e) => active && setError(e.response?.data?.error?.message || 'Failed to load'));
    return () => {
      active = false;
    };
  }, [problemId]);

  if (error) return <p className="text-rose-500">{error}</p>;
  if (!problem) return <p className="text-slate-400">Loading…</p>;

  const done = isDone(problem.id);
  const links = LINKS.filter(([key]) => problem.links?.[key]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to={`/topics/${problem.topicId}`} className="text-sm text-indigo-600 hover:underline">
        ← Back to topic
      </Link>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        {problem.subtopic && <p className="mt-1 text-sm text-slate-400">{problem.subtopic}</p>}
        {problem.description && (
          <p className="mt-4 text-slate-600 dark:text-slate-300">{problem.description}</p>
        )}

        <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800">
          <input
            type="checkbox"
            className="h-5 w-5 accent-indigo-600"
            checked={done}
            onChange={(e) => toggle(problem.id, e.target.checked)}
          />
          <span className="text-sm font-medium">{done ? 'Completed' : 'Mark as complete'}</span>
        </label>

        {links.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Resources
            </h2>
            <div className="flex flex-wrap gap-2">
              {links.map(([key, label]) => (
                <a
                  key={key}
                  href={problem.links[key]}
                  target="_blank"
                  rel="noreferrer"
                  className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  {label} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
