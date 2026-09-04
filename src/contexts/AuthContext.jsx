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
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      throw new Error(`Server connection failed. Please try again.`);
    }
    if (!res.ok) throw new Error(data.error || (data.errors && data.errors[0]?.msg) || 'Registration failed');
    return data;
  }, []);

  const login = useCallback(async ({ email, password, totpCode }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totpCode }),
    });
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      throw new Error(`Server connection failed. Please try again.`);
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.requires2FA) return data;
    localStorage.setItem('aa_access_token',  data.accessToken);
    localStorage.setItem('aa_refresh_token', data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const verify2FA = useCallback(async ({ tempToken, code }) => {
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    localStorage.setItem('aa_access_token',  data.accessToken);
    localStorage.setItem('aa_refresh_token', data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const resend2FA = useCallback(async ({ tempToken }) => {
    const res = await fetch('/api/auth/resend-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend code');
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
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logout(); return null;
    }
    const { accessToken, refreshToken: newRefresh } = await res.json();
    localStorage.setItem('aa_access_token',  accessToken);
    localStorage.setItem('aa_refresh_token', newRefresh);
    return accessToken;
  }, [logout]);

  // Authorised fetch helper — auto-refreshes on 401
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('aa_access_token');
    const isFormData = options.body instanceof FormData;
    
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { cache: 'no-store', ...options, headers });
    if (res.status === 401) {
      const newToken = await refreshToken();
      if (!newToken) throw new Error('Session expired');
      
      const retryHeaders = {
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      };
      if (!isFormData && !retryHeaders['Content-Type']) {
        retryHeaders['Content-Type'] = 'application/json';
      }

      return fetch(url, { cache: 'no-store', ...options, headers: retryHeaders });
    }
    return res;
  }, [refreshToken]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('aa_access_token');
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
    return null;
  }, []);

  const isAdmin          = user?.role === 'admin';
  const isClerk          = user?.role === 'clerk';
  const isContentEditor  = user?.role === 'content_editor';
  const isInstructor     = user?.role === 'instructor';
  const isFinance        = user?.role === 'finance';
  const isMember         = user?.role === 'member';
  const isStaff          = isAdmin || isClerk || isContentEditor || isInstructor || isFinance;

  return (
    <AuthContext.Provider value={{
      user, loading, refreshUser,
      login, logout, register, authFetch, verify2FA, resend2FA,
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
