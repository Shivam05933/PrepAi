import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsInitializing(true);
        const currentUser = await api.get("/auth/me");
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    loadUser();
  }, []);

  const register = async (data) => {
    setAuthLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      setUser(response);
      return response;
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (data) => {
    setAuthLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      setUser(response);
      return response;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await api.post("/auth/logout");
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, isInitializing, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
