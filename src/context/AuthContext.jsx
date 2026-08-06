import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartsupport_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verify error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, ...userData } = res.data.data;
      localStorage.setItem('smartsupport_token', newToken);
      setToken(newToken);
      setUser(userData);
      return res.data;
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  const register = async (name, email, password, role = 'customer') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const { token: newToken, ...userData } = res.data.data;
      localStorage.setItem('smartsupport_token', newToken);
      setToken(newToken);
      setUser(userData);
      return res.data;
    } else {
      throw new Error(res.data.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('smartsupport_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
