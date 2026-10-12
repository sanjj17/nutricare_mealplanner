import { createContext, useCallback, useContext, useState } from "react";
import { clearSession, getStoredUser, saveSession } from "../session";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());

  const login = useCallback((userData, token) => {
    if (token) saveSession(token, userData);
    else if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData || null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
