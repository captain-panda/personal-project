import { Link } from 'react-router-dom';
import DifficultyBadge from './DifficultyBadge.jsx';
import { useProgress } from '../context/ProgressContext.jsx';

const LINKS = [
  ['leetcode', 'LeetCode'],
  ['youtube', 'Video'],
  ['codeforces', 'CF'],
  ['article', 'Article'],
];

export default function ProblemCard({ problem }) {
  const { isDone, toggle } = useProgress();
  const done = isDone(problem.id);

  return (
    <div className="card flex items-center gap-3 p-3">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => toggle(problem.id, e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-indigo-600"
        aria-label={`Mark ${problem.title} ${done ? 'incomplete' : 'complete'}`}
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/problems/${problem.id}`}
          className={`block truncate font-medium hover:text-indigo-600 ${
            done ? 'text-slate-400 line-through' : ''
          }`}
        >
          {problem.title}
        </Link>
        {problem.subtopic && <span className="text-xs text-slate-400">{problem.subtopic}</span>}
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {LINKS.map(([key, label]) =>
          problem.links?.[key] ? (
            <a
              key={key}
              href={problem.links[key]}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-500 hover:underline"
            >
              {label}
            </a>
          ) : null,
        )}
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
    </div>
  );
}
