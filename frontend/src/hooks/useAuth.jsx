import { useState, useCallback } from "react";
import { getStoredAuth, storeAuth, clearAuth } from "../api";

import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);
  const isLoading = false;


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
