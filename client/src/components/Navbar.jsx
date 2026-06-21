import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `btn-ghost ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-xs text-white">
            DSA
          </span>
          <span>Sheet</span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/topics" className={navClass}>
            Topics
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-ghost" aria-label="Toggle dark mode">
            {dark ? '☀️' : '🌙'}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="btn-ghost">
              {user?.displayName || user?.email} ▾
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="truncate px-3 py-2 text-xs text-slate-400">{user?.email}</div>
                  <button
                    onClick={onLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
