import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/axios';

const AuthContext = createContext(null);

const readSavedUser = () => {
  try {
    const savedUser = localStorage.getItem('spikeUser');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem('spikeUser');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const [loading, setLoading] = useState(true);

  // Validate the saved token against the server before rendering protected pages.
  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const token = localStorage.getItem('spikeToken');

      if (!token) {
        localStorage.removeItem('spikeUser');

        if (active) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          localStorage.setItem('spikeUser', JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem('spikeToken');
        localStorage.removeItem('spikeUser');
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    validateSession();

    return () => {
      active = false;
    };
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
