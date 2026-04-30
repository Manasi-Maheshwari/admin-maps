import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import './Sidebar.css';

export default function Sidebar({ onNavigate }) {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__mark" aria-hidden="true">
          <img src="/maps-logo.png" alt="MAPS logo" className="sidebar__mark-img" />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-line">MAPS</span>
          <span className="sidebar__brand-year">2026</span>
        </div>
      </div>

      <div className="sidebar__section">
        <span className="eyebrow sidebar__label">Workspace</span>
        <nav className="sidebar__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'is-active' : ''}`
            }
            onClick={onNavigate}
            end
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <rect x="2" y="2" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="11" y="2" width="7" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="11" y="8" width="7" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="2" y="11" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Users
          </NavLink>
        </nav>
      </div>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__logout"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M8 4H4v12h4M13 7l3 3-3 3M16 10H8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>

        <div className="sidebar__credit">
          <span className="eyebrow">Build</span>
          <span className="mono sidebar__credit-val">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
