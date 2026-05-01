// Thin fetch() wrapper — no Axios, KISS.
// All HTTP details live here; repositories call apiRequest(), not fetch().

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://192.168.0.164:5000';

let _userId: string | null = null;

// Called by AuthContext after login / restore from SecureStore
export const setCurrentUserId = (userId: string | null): void => {
  _userId = userId;
};

export const getCurrentUserId = (): string | null => _userId;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Dev: pass userId as a header so the server can identify the caller.
    // Production: replace with Authorization: Bearer <supabase_token>
    ...(_userId ? { 'X-User-Id': _userId } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 204 No Content — return undefined
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    // OpenAPI ProblemDetails shape: { title, detail, status }
    const message: string =
      (body as { detail?: string; title?: string }).detail ??
      (body as { title?: string }).title ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}
