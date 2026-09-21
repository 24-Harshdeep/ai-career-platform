const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const API_BASE_URL = `${configuredApiUrl.replace(/\/+$/, "")}${
  /\/api$/i.test(configuredApiUrl) ? "" : "/api"
}`;

export async function safeParseJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  throw new Error(
    `API returned non-JSON response (${response.status} ${response.statusText}). Check if backend server is running.`
  );
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("careeros_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("careeros_token");
    window.dispatchEvent(new Event("careeros_auth_expired"));
  }

  return response;
}
