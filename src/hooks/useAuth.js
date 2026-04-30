import { useCallback, useEffect, useState } from 'react';
import {
  AUTH_EVENT,
  getSession,
  login as loginSvc,
  logout as logoutSvc
} from '../services/auth.js';

/**
 * Auth hook. Reads session from localStorage and exposes login/logout.
 */
export function useAuth() {
  const [session, setSession] = useState(() => getSession());

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'maps_admin_session') {
        setSession(getSession());
      }
    }
    function onAuthChange() {
      setSession(getSession());
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_EVENT, onAuthChange);
    };
  }, []);

  const login = useCallback((email, password) => {
    const next = loginSvc(email, password);
    if (next) setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    logoutSvc();
    setSession(null);
  }, []);

  return { session, login, logout, isAuthenticated: !!session };
}
