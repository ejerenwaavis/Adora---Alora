import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from stored access token on mount
  useEffect(() => {
    const token = localStorage.getItem('aa_access_token');
    if (!token) { setLoading(false); return; }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('aa_access_token'))
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || (data.errors && data.errors[0]?.msg) || 'Registration failed');
    return data;
  }, []);

  const login = useCallback(async ({ email, password, totpCode }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.requires2FA) return { requires2FA: true };
    localStorage.setItem('aa_access_token',  data.accessToken);
    localStorage.setItem('aa_refresh_token', data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const token   = localStorage.getItem('aa_access_token');
    const refresh = localStorage.getItem('aa_refresh_token');
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => {});
    localStorage.removeItem('aa_access_token');
    localStorage.removeItem('aa_refresh_token');
    setUser(null);
  }, []);

  // Refresh access token using stored refresh token
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('aa_refresh_token');
    if (!refresh) return null;
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) { logout(); return null; }
    const { accessToken, refreshToken: newRefresh } = await res.json();
    localStorage.setItem('aa_access_token',  accessToken);
    localStorage.setItem('aa_refresh_token', newRefresh);
    return accessToken;
  }, [logout]);

  // Authorised fetch helper — auto-refreshes on 401
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('aa_access_token');
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      const newToken = await refreshToken();
      if (!newToken) throw new Error('Session expired');
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
    return res;
  }, [refreshToken]);

  const isAdmin          = user?.role === 'admin';
  const isClerk          = user?.role === 'clerk';
  const isContentEditor  = user?.role === 'content_editor';
  const isInstructor     = user?.role === 'instructor';
  const isFinance        = user?.role === 'finance';
  const isMember         = user?.role === 'member';
  const isStaff          = isAdmin || isClerk || isContentEditor || isInstructor || isFinance;

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout, register, authFetch,
      isAdmin, isClerk, isContentEditor, isInstructor, isFinance, isMember, isStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
