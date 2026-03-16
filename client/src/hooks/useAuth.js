import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cv_token'));
  const [loading, setLoading] = useState(true);
  const [faceToken, setFaceToken] = useState(null);

  useEffect(() => {
    if (token) {
      api.me(token).then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem('cv_token'); setToken(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('cv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    localStorage.setItem('cv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cv_token');
    setToken(null);
    setUser(null);
    setFaceToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      const u = await api.me(token);
      setUser(u);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, faceToken, setFaceToken, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
