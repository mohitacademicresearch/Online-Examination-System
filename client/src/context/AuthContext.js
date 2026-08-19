import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('examAppUser');
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (data) => {
    localStorage.setItem('examAppUser', JSON.stringify(data));
    setUser(data);
  };

  const registerStudent = async ({ name, email, password }) => {
    const { data } = await api.post('/users/register', { name, email, password });
    persist(data);
    return data;
  };

  const login = async ({ email, password, expectedRole }) => {
    const { data } = await api.post('/users/login', { email, password, expectedRole });
    persist(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('examAppUser');
    setUser(null);
  };

  // Updates the user data after profile changes.
  const refreshUser = (updates) => {
    setUser((prev) => {
      const merged = { ...prev, ...updates };
      localStorage.setItem('examAppUser', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, registerStudent, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);