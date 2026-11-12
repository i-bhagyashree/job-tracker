import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ token, user }) => {
    localStorage.setItem('token', token);
    setUser(user);
  };

  const login = (data) => api.post('/auth/login', data).then((r) => handleAuth(r.data));
  const register = (data) => api.post('/auth/register', data).then((r) => handleAuth(r.data));
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const updateProfile = (data) => api.patch('/auth/me', data).then((r) => setUser(r.data.user));
  const changePassword = (data) => api.patch('/auth/password', data);
  const deleteAccount = (password) => api.delete('/auth/me', { data: { password } }).then(logout);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
