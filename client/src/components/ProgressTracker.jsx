function DiffBar({ difficulty, solved, total }) {
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const color =
    difficulty === 'Easy' ? 'bg-emerald-500' : difficulty === 'Medium' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{difficulty}</span>
        <span className="text-slate-400">
          {solved}/{total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProgressTracker({ percent = 0, solved = 0, total = 0, byDifficulty = [] }) {
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(#4f46e5 ${percent * 3.6}deg, rgb(226 232 240) 0deg)` }}
          />
          <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
            <span className="text-2xl font-bold">{percent}%</span>
            <span className="text-xs text-slate-400">
              {solved}/{total}
            </span>
          </div>
        </div>
        <div className="w-full flex-1 space-y-2">
          {byDifficulty.map((d) => (
            <DiffBar key={d.difficulty} {...d} />
          ))}
        </div>
      </div>
    </div>
  );
}
