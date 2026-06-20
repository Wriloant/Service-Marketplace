// Thin fetch wrapper around the FastAPI backend.
// The token is kept in a cookie so that (a) the API client can read it here and
// (b) Next.js middleware can read it server-side for route protection.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export function setCookie(name: string, value: string, days = 1) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/`;
}

export function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

type Opts = {
  method?: string;
  body?: unknown;
  form?: Record<string, string>;
  auth?: boolean;
};

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method: opts.method || "GET" };

  if (opts.auth !== false) {
    const token = getCookie("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  if (opts.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = new URLSearchParams(opts.form).toString();
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  init.headers = headers;
  const res = await fetch(`${API_URL}${path}`, init);

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- typed endpoint helpers ------------------------------------------------
export const Api = {
  login: (email: string, password: string) =>
    api<{ access_token: string; role: string }>("/auth/login", {
      form: { username: email, password }, auth: false,
    }),
  register: (body: any) =>
    api<{ access_token: string; role: string }>("/auth/register", { method: "POST", body, auth: false }),
  me: () => api("/auth/me"),

  categories: () => api<any[]>("/categories", { auth: false }),
  services: (q = "", category = "") =>
    api<any[]>(`/services?${new URLSearchParams({ ...(q && { q }), ...(category && { category }) })}`, { auth: false }),
  service: (id: string | number) => api(`/services/${id}`, { auth: false }),

  createOrder: (body: any) => api("/orders", { method: "POST", body }),
  payOrder: (id: string | number, card_token: string) =>
    api(`/orders/${id}/pay`, { method: "POST", body: { card_token } }),
  myOrders: () => api<any[]>("/orders"),
  order: (id: string | number) => api(`/orders/${id}`),

  vendorServices: () => api<any[]>("/vendor/services"),
  vendorOrders: () => api<any[]>("/vendor/orders"),
  createService: (body: any) => api("/services", { method: "POST", body }),
  updateService: (id: number, body: any) => api(`/services/${id}`, { method: "PATCH", body }),

  adminStats: () => api("/admin/stats"),
  adminUsers: () => api<any[]>("/admin/users"),
  adminOrders: () => api<any[]>("/admin/orders"),
};
