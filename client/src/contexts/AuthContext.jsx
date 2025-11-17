import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/api/auth/me", { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      // Fallback to token in localStorage
      const token = localStorage.getItem("veritygem_token");
      if (token) {
        try {
          const response = await api.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.user);
        } catch (err) {
          localStorage.removeItem("veritygem_token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  // supports: login("email", "password") or login({ email, password })
  const login = async (emailOrPayload, maybePassword) => {
    const payload =
      typeof emailOrPayload === "string"
        ? { email: emailOrPayload, password: maybePassword }
        : emailOrPayload; // { email, password }

    try {
      const response = await api.post("/api/auth/login", payload, {
        withCredentials: true,
      });

      setUser(response.data.user);

      if (response.data.token) {
        localStorage.setItem("veritygem_token", response.data.token);
      }

      return response.data;
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Invalid email or password";
      throw new Error(msg);
    }
  };

  // supports: register("name", "email", "password") or register({ name, email, password })
  const register = async (nameOrPayload, emailMaybe, passwordMaybe) => {
    const payload =
      typeof nameOrPayload === "string"
        ? { name: nameOrPayload, email: emailMaybe, password: passwordMaybe }
        : nameOrPayload; // { name, email, password }

    try {
      const response = await api.post("/api/auth/register", payload, {
        withCredentials: true,
      });

      setUser(response.data.user);

      if (response.data.token) {
        localStorage.setItem("veritygem_token", response.data.token);
      }

      return response.data;
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Unable to create account";
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("veritygem_token");
    setUser(null);
  };

  const updateUserCurrency = (currency) => {
    if (user) {
      setUser({ ...user, currency });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        updateUserCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
