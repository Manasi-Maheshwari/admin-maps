import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import './AdminLayout.css';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      <div
        className={`admin-shell__sidebar ${mobileOpen ? 'is-open' : ''}`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {mobileOpen && (
        <div
          className="admin-shell__scrim"
          role="presentation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="admin-shell__main">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
