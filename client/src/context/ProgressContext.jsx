import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const ProgressContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useProgress = () => useContext(ProgressContext);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState({}); // problemId -> boolean
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, s] = await Promise.all([
        api.get('/api/topics'),
        api.get('/api/progress/me'),
        api.get('/api/progress/stats'),
      ]);
      setTopics(t.data.topics);
      const map = {};
      for (const row of p.data.progress) map[row.problemId] = row.completed;
      setProgress(map);
      setStats(s.data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      reload();
    } else {
      setTopics([]);
      setProgress({});
      setStats(null);
    }
  }, [user, reload]);

  const refreshStats = useCallback(async () => {
    try {
      const s = await api.get('/api/progress/stats');
      setStats(s.data.stats);
    } catch {
      /* keep stale stats on failure */
    }
  }, []);

  const toggle = useCallback(
    async (problemId, next) => {
      setProgress((prev) => ({ ...prev, [problemId]: next })); // optimistic
      try {
        await api.patch(`/api/progress/${problemId}`, { completed: next });
        refreshStats();
      } catch (e) {
        setProgress((prev) => ({ ...prev, [problemId]: !next })); // revert
        throw e;
      }
    },
    [refreshStats],
  );

  const isDone = useCallback((id) => Boolean(progress[id]), [progress]);

  return (
    <ProgressContext.Provider value={{ topics, progress, stats, loading, reload, toggle, isDone }}>
      {children}
    </ProgressContext.Provider>
  );
}
