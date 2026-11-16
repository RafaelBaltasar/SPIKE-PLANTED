import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('spikeUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(true);

  // Optional: Validate token on load (requires /auth/me endpoint in backend)
  useEffect(() => {
    const token = localStorage.getItem('spikeToken');
    if (!token) setLoading(false);
    else setLoading(false); 
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('spikeToken', token);
    localStorage.setItem('spikeUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('spikeToken');
    localStorage.removeItem('spikeUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);