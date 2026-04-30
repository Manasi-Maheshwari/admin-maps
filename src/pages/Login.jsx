import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import './Login.css';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  if (isAuthenticated) {
    const dest = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={dest} replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    // small delay to keep the UI honest
    setTimeout(() => {
      const session = login(email, password);
      if (!session) {
        setError('Invalid credentials. Please check your email and password.');
        setSubmitting(false);
        return;
      }
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    }, 300);
  }

  return (
    <div className="login">
      <aside className="login__art" aria-hidden="true">
        <div className="login__art-inner">
          <div className="login__art-mark">
            <img src="/maps-logo.png" alt="MAPS logo" className="login__art-logo" />
          </div>
          <div className="login__art-content">
            <span className="eyebrow login__art-eyebrow">Restricted Access</span>
            <h2 className="serif login__art-title">
              MAPS<span className="login__art-amp"> · </span>2026
            </h2>
            <p className="login__art-tag">
              Administrative console for monitoring registration and form submissions.
            </p>

            <ul className="login__art-list">
              <li><span className="login__art-num">01</span> Real-time submission monitoring</li>
              <li><span className="login__art-num">02</span> Filter, sort & search across attendees</li>
              <li><span className="login__art-num">03</span> Inspect raw payload data per record</li>
            </ul>
          </div>

          <div className="login__art-footer mono">
            <span>Singapore Operations</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      <main className="login__main">
        <div className="login__card fade-up">
          <div className="login__head">
            <span className="eyebrow">Sign in</span>
            <h1 className="serif login__title">Welcome back.</h1>
            <p className="login__sub">
              Enter your administrator credentials to access the console.
            </p>
          </div>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <label className="login__field">
              <span className="login__label">Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mapsblufin.com"
                autoComplete="username"
                disabled={submitting}
                spellCheck="false"
              />
            </label>

            <label className="login__field">
              <div className="login__label-row">
                <span className="login__label">Password</span>
                <button
                  type="button"
                  className="login__toggle"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={submitting}
              />
            </label>

            {error && (
              <div className="login__error" role="alert">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4v5M8 11.5v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="login__submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size={16} />
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login__legal">
            Secured access. Unauthorized attempts are logged and reported.
          </p>
        </div>
      </main>
    </div>
  );
}
