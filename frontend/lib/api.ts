const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(
      errorBody.message || `API error: ${res.status}`
    ) as Error & { status: number; body: unknown };
    error.status = res.status;
    error.body = errorBody;
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
