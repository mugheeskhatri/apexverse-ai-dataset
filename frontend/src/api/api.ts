import Router from "next/router";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens({ access, refresh }: { access: string; refresh: string }) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error("No refresh token");
  const res = await fetch("/api/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  const data = await res.json();
  setTokens({ access: data.access_token, refresh: data.refresh_token });
  return data.access_token;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  let token = accessToken;
  let resp = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (resp.status === 401 && refreshToken) {
    try {
      token = await refreshAccessToken();
      resp = await fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (resp.status === 401) throw new Error("Unauthorized after refresh");
    } catch {
      clearTokens();
      Router.push("/login");
      throw new Error("Unauthorized");
    }
  }

  if (resp.status === 402) {
    Router.push("/checkout");
    throw new Error("Payment required");
  }

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || resp.statusText);
  }

  return resp.json();
}