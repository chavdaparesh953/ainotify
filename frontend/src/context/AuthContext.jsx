import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';

const AuthContext = createContext(null);

function getStoredToken() {
  return localStorage.getItem('saas_auth_token') || sessionStorage.getItem('saas_auth_token') || null;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('saas_user_data') || sessionStorage.getItem('saas_user_data');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Checks if JWT is locally expired according to its 'exp' claim.
 * Avoids kicking users out if token is still valid.
 */
function isTokenExpired(jwtToken) {
  if (!jwtToken) return true;
  try {
    const payloadBase64 = jwtToken.split('.')[1];
    if (!payloadBase64) return false;
    const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    if (!decoded.exp) return false;
    // Expired if current time >= (exp timestamp in ms - 10s grace window)
    return Date.now() >= decoded.exp * 1000 - 10000;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = getStoredToken();
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem('saas_auth_token');
      localStorage.removeItem('saas_user_data');
      sessionStorage.removeItem('saas_auth_token');
      sessionStorage.removeItem('saas_user_data');
      return null;
    }
    return stored;
  });

  const [user, setUser] = useState(() => {
    const storedToken = getStoredToken();
    if (storedToken && !isTokenExpired(storedToken)) {
      return getStoredUser();
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync / verify user session on mount
  useEffect(() => {
    async function verifySession() {
      if (token) {
        if (isTokenExpired(token)) {
          console.warn('[Auth] Token expired locally according to exp claim.');
          logout();
          setIsLoading(false);
          return;
        }

        try {
          const res = await axiosClient.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            const isLocal = Boolean(localStorage.getItem('saas_auth_token'));
            const storage = isLocal ? localStorage : sessionStorage;
            storage.setItem('saas_user_data', JSON.stringify(res.data.user));
          }
        } catch (err) {
          const status = err.response?.status;
          console.warn('[Auth] Session validation response:', status || err.message);

          // ONLY logout if the backend explicitly rejected the credentials with 401 Unauthorized or 403 Forbidden
          if (status === 401 || status === 403) {
            logout();
          } else {
            // Server might be sleeping (Render cold start) or network connection is fluctuating.
            // DO NOT log the merchant out; keep the cached local session active!
            console.warn('[Auth] Backend waking up or network offline. Retaining persisted session.');
          }
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password, rememberMe = true) => {
    const res = await axiosClient.post('/auth/login', { email, password, rememberMe });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    const primaryStorage = rememberMe ? localStorage : sessionStorage;
    const secondaryStorage = rememberMe ? sessionStorage : localStorage;

    primaryStorage.setItem('saas_auth_token', receivedToken);
    primaryStorage.setItem('saas_user_data', JSON.stringify(receivedUser));

    // Clear the secondary storage to prevent conflict
    secondaryStorage.removeItem('saas_auth_token');
    secondaryStorage.removeItem('saas_user_data');

    return res.data;
  };

  const register = async (email, password) => {
    const res = await axiosClient.post('/auth/register', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem('saas_auth_token', receivedToken);
    localStorage.setItem('saas_user_data', JSON.stringify(receivedUser));
    sessionStorage.removeItem('saas_auth_token');
    sessionStorage.removeItem('saas_user_data');

    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('saas_auth_token');
    localStorage.removeItem('saas_user_data');
    sessionStorage.removeItem('saas_auth_token');
    sessionStorage.removeItem('saas_user_data');
  };

  const completeOnboarding = async () => {
    const res = await axiosClient.post('/auth/complete-onboarding');
    if (res.data?.user) {
      setUser(res.data.user);
      const isLocal = Boolean(localStorage.getItem('saas_auth_token'));
      const storage = isLocal ? localStorage : sessionStorage;
      storage.setItem('saas_user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const updateUserData = (partialUser) => {
    setUser((prev) => {
      const updated = { ...prev, ...partialUser };
      const isLocal = Boolean(localStorage.getItem('saas_auth_token'));
      const storage = isLocal ? localStorage : sessionStorage;
      storage.setItem('saas_user_data', JSON.stringify(updated));
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
