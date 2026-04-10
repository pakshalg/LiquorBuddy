import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getMe } from '../services/api';
import { disconnectSocket, reconnectSocket } from '../services/socket';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      getMe().then(setUser).catch(() => { setToken(null); localStorage.removeItem('token'); });
    }
  }, [token]);

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    reconnectSocket(); // reconnect with the new token so user:room works
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectSocket(); // drop the authenticated socket connection
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
