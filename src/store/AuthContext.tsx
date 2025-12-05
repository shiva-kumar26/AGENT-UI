// src/store/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import useLocalStorageState from "use-local-storage-state";

interface AuthType {
  userId?: string;
  userName?: string;
  password?: string;
  status?: string;
  isAuthenticated: boolean;
  hostname?: string;
  role?: string;
  extension?: string;
}

interface AuthContextType {
  auth: AuthType | null;
  authReady: boolean;
  login: (data: AuthType) => void;
  logout: () => void;
  setAuthField: (key: string, value: any) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useLocalStorageState<AuthType | null>("auth", {
    defaultValue: null,
  });
  
  const [authReady, setAuthReady] = useState(false);

  // Mark auth as ready after first mount (even if null)
  useEffect(() => {
    setAuthReady(true);
  }, []);

  const login = (data: AuthType) => setAuth(data);
  const logout = () => setAuth(null);

  const setAuthField = (key: string, value: any) => {
    setAuth((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const value = { auth, authReady, login, logout, setAuthField };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};