import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStoredAuth, storeAuth, clearAuth } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check from localStorage
    const stored = getStoredAuth();
    setAuth(stored);
    setIsLoading(false);
  }, []);

  const loginUser = useCallback((authData) => {
    storeAuth(authData);
    setAuth({ token: authData.token, email: authData.user.email });
  }, []);

  const logoutUser = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAuthenticated: !!auth?.token,
        login: loginUser,
        logout: logoutUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
