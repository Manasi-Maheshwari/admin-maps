/**
 * Static authentication service.
 * Credentials are hardcoded per spec; sessions persist in localStorage.
 */

const ADMIN_EMAIL = '<REDACTED_EMAIL>';
const ADMIN_PASSWORD = '<REDACTED_PASSWORD>';
const STORAGE_KEY = 'maps_admin_session';
const AUTH_EVENT = 'maps_admin_auth_changed';

/**
 * Attempt login. Returns the session on success, null on failure.
 */
export function login(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (
    normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
    normalizedPassword === ADMIN_PASSWORD
  ) {
    const session = {
      email: ADMIN_EMAIL,
      displayName: 'Singapore Admin',
      loggedInAt: new Date().toISOString(),
      token: cryptoRandom()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    notifyAuthChange();
    return session;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  notifyAuthChange();
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

function cryptoRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

export { AUTH_EVENT };

