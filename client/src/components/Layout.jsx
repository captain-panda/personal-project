import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import SidebarNav from './SidebarNav.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <SidebarNav />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
