
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("TXFORT_token");

    if (!token) {
      setInitializing(false);
      return;
    }

    api.get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem("TXFORT_token");
        setUser(null);
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  async function login(credentials) {
    const response = await api.post("/auth/login", credentials);

    localStorage.setItem("TXFORT_token", response.data.token);
    setUser(response.data.user);

    return response.data;
  }

  async function register(details) {
    const response = await api.post("/auth/register", details);

    localStorage.setItem("TXFORT_token", response.data.token);
    setUser(response.data.user);

    return response.data;
  }

  function logout() {
    localStorage.removeItem("TXFORT_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
