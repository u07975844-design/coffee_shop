import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthAPI } from '../api/services.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await AuthAPI.me();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const data = await AuthAPI.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await AuthAPI.register(payload);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (payload) => {
    const data = await AuthAPI.updateProfile(payload);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
