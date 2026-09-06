/** Only the registered app scheme and exact auth destinations can establish sessions. */
export const AUTH_CALLBACK_URL = 'ultraedge://auth/callback';
export const PASSWORD_RESET_URL = 'ultraedge://auth/reset-password';

export function parseAuthCallback(url: string, destination: 'callback' | 'reset-password'): URLSearchParams | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'ultraedge:' || parsed.hostname !== 'auth' ||
        parsed.pathname !== `/${destination}` || parsed.port || parsed.username || parsed.password) return null;
    const params = new URLSearchParams(parsed.hash.slice(1));
    // Reject duplicates and query/fragment ambiguity instead of choosing a token silently.
    const seen = new Set<string>();
    for (const [key] of params) {
      if (seen.has(key)) return null;
      seen.add(key);
    }
    for (const [key, value] of parsed.searchParams) {
      if (seen.has(key)) return null;
      seen.add(key);
      params.set(key, value);
    }
    return params;
  } catch { return null; }
}

export function recoveryTokens(params: URLSearchParams) {
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (params.get('error') || params.get('error_code') || params.get('type') !== 'recovery' ||
      !access_token || access_token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(access_token) ||
      !refresh_token || refresh_token.length < 8 || refresh_token.length > 512 || !/^[A-Za-z0-9._-]+$/.test(refresh_token)) return null;
  return { access_token, refresh_token };
}

export function isSupabaseConfigured(url: string, key: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password &&
      !!parsed.hostname && key.length > 20 && !/placeholder|your[_-]|xxxxx/i.test(`${url} ${key}`);
  } catch { return false; }
}
