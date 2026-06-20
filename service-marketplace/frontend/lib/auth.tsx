"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Api, clearCookie, getCookie, setCookie } from "./api";

type AuthState = {
  token: string | null;
  role: string | null;
  name: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (body: any) => Promise<string>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Rehydrate from cookies on first mount.
  useEffect(() => {
    setToken(getCookie("token"));
    setRole(getCookie("role"));
    setName(getCookie("name"));
    setReady(true);
  }, []);

  function persist(tok: string, r: string, n: string) {
    setCookie("token", tok);
    setCookie("role", r);
    setCookie("name", n);
    setToken(tok); setRole(r); setName(n);
  }

  async function login(email: string, password: string) {
    const res = await Api.login(email, password);
    setCookie("token", res.access_token);
    setCookie("role", res.role);
    const me: any = await Api.me();
    persist(res.access_token, res.role, me.name);
    return res.role;
  }

  async function register(body: any) {
    const res = await Api.register(body);
    setCookie("token", res.access_token);
    setCookie("role", res.role);
    const me: any = await Api.me();
    persist(res.access_token, res.role, me.name);
    return res.role;
  }

  function logout() {
    clearCookie("token"); clearCookie("role"); clearCookie("name");
    setToken(null); setRole(null); setName(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, name, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
