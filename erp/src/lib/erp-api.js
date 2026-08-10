const TOKEN_KEY = "erp_session_token";

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Error de conexión");
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function checkAuthStatus() {
  try {
    return await apiFetch("/api/auth/status");
  } catch (e) {
    if (e.status === 401) return { ok: false };
    throw e;
  }
}

export async function login(password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setToken(data.token);
  return data;
}

export async function fetchErpData() {
  return apiFetch("/api/erp/data");
}

export async function saveErpData(payload) {
  return apiFetch("/api/erp/data", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  clearToken();
}
