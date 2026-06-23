import { useState, useEffect } from "react";

const TOKEN_KEY = "marujo_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export function useAdminAuth() {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setChecked(true);
      return;
    }
    fetch("/api/admin/session", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        setAuthenticated(r.ok);
        if (!r.ok) clearAdminToken();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, []);

  async function login(password: string): Promise<string | null> {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return (data as any).error ?? "Senha incorreta";
    }
    const data = await r.json();
    setAdminToken(data.token);
    setAuthenticated(true);
    return null;
  }

  function logout() {
    clearAdminToken();
    setAuthenticated(false);
  }

  return { checked, authenticated, login, logout };
}
