import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('saas_auth_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('saas_user_data');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync / verify user session on mount
  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('saas_user_data', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('saas_auth_token', receivedToken);
    localStorage.setItem('saas_user_data', JSON.stringify(receivedUser));

    return res.data;
  };

  const register = async (email, password) => {
    const res = await axiosClient.post('/auth/register', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('saas_auth_token', receivedToken);
    localStorage.setItem('saas_user_data', JSON.stringify(receivedUser));

    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('saas_auth_token');
    localStorage.removeItem('saas_user_data');
  };

  const completeOnboarding = async () => {
    const res = await axiosClient.post('/auth/complete-onboarding');
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('saas_user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const updateUserData = (partialUser) => {
    setUser((prev) => {
      const updated = { ...prev, ...partialUser };
      localStorage.setItem('saas_user_data', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
