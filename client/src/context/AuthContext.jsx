import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { isTokenValid } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mcc_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mcc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Validate stored session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('mcc_token');
    const storedUser = localStorage.getItem('mcc_user');

    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      try {
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    } else {
      // Clear expired credentials
      localStorage.removeItem('mcc_token');
      localStorage.removeItem('mcc_user');
      setToken(null);
      setUser(null);
    }
    setLoading(false);

    // Listen for unauthorized events emitted by Axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('mcc:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mcc:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Authenticate with email & password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<any>}
   */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    if (res.token && res.user) {
      localStorage.setItem('mcc_token', res.token);
      localStorage.setItem('mcc_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid authentication response from server');
  };

  /**
   * Terminate active session and clear storage.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('mcc_token');
    localStorage.removeItem('mcc_user');
    setToken(null);
    setUser(null);
    navigate('/');
  }, [navigate]);

  /**
   * Check if user is currently authenticated with a valid token.
   * @returns {boolean}
   */
  const isAuthenticated = useCallback(() => {
    return Boolean(token && user && isTokenValid(token));
  }, [token, user]);

  /**
   * Verify if the active user possesses one of the required roles.
   * @param {string|string[]} roles
   * @returns {boolean}
   */
  const hasRole = useCallback(
    (roles) => {
      if (!user || !user.role) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(user.role);
    },
    [user]
  );

  /**
   * Update active user profile in memory and localStorage.
   */
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('mcc_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
