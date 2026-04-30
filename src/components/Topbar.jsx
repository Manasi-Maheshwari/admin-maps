import { useAuth } from '../hooks/useAuth.js';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  const { session } = useAuth();
  const initials = (session?.email || 'A')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 20 20" width="20" height="20">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="topbar__heading">
          <span className="eyebrow">Console</span>
          <h1 className="topbar__title serif">MAPS 2026 Admin Panel</h1>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__indicator" aria-live="polite">
          <span className="topbar__dot" aria-hidden="true" />
          <span className="topbar__indicator-text">Live</span>
        </div>

        <div className="topbar__user">
          <div className="topbar__user-meta">
            <span className="topbar__user-name">{session?.displayName || 'Admin'}</span>
            <span className="topbar__user-email">{session?.email}</span>
          </div>
          <div className="topbar__avatar" aria-hidden="true">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
