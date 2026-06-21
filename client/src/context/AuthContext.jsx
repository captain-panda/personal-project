import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  // Persistent login: attempt a refresh from the httpOnly cookie on load.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.post('/api/auth/refresh');
        if (active) applySession(data);
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applySession]);

  // Forced logout when a refresh fails inside an API interceptor.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/api/auth/login', { email, password });
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (email, password, displayName) => {
      const { data } = await api.post('/api/auth/register', { email, password, displayName });
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
