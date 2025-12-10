import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, apiUrl } from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem("edupro360_tokens");
    return saved ? JSON.parse(saved) : null;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("edupro360_user");
    return saved ? JSON.parse(saved) : null;
  });
  const isAuthenticated = Boolean(tokens?.access);

  useEffect(() => {
    if (tokens) {
      localStorage.setItem("edupro360_tokens", JSON.stringify(tokens));
    } else {
      localStorage.removeItem("edupro360_tokens");
    }
  }, [tokens]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("edupro360_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("edupro360_user");
    }
  }, [user]);

  const login = useCallback(async (usuario, contraseña) => {
    // Usar Django backend
    const response = await apiFetch('/auth/login/', {
      method: 'POST',
      body: { email: usuario, password: contraseña },
    });

    if (response.access && response.refresh) {
      setTokens({ access: response.access, refresh: response.refresh });

      // Obtener datos del usuario
      const userData = await apiFetch('/auth/me/', {
        method: 'GET',
        token: response.access,
      });

      setUser(userData);
      return { success: true, user: userData, tokens: response };
    } else {
      throw new Error('Error al iniciar sesión');
    }
  }, []);

  const register = useCallback(async (payload) => {
    const response = await apiFetch("/auth/registro/", {
      method: "POST",
      body: payload,
    });
    if (response.tokens) {
      setTokens(response.tokens);
    }
    if (response.user) {
      setUser(response.user);
    }
    return response;
  }, []);

  const requestRecovery = useCallback(async (email) => {
    return apiFetch("/auth/recuperar/", {
      method: "POST",
      body: { email },
    });
  }, []);

  const confirmRecovery = useCallback(async ({ token, nueva_contrasena }) => {
    return apiFetch("/auth/recuperar/confirmar/", {
      method: "POST",
      body: { token, nueva_contrasena },
    });
  }, []);

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      apiUrl,
      tokens,
      user,
      isAuthenticated,
      login,
      register,
      logout,
      requestRecovery,
      confirmRecovery,
    }),
    [confirmRecovery, isAuthenticated, login, logout, register, requestRecovery, tokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}