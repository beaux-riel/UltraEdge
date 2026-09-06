import { isSupabaseConfigured, parseAuthCallback, recoveryTokens } from '../lib/authLinks';

describe('Account configuration', () => {
  it.each([['', ''], ['invalid', 'key'], ['https://xxxxx.supabase.co', 'long-placeholder-key-here'],
    ['http://project.supabase.co', 'a'.repeat(30)], ['https://user:pass@project.supabase.co', 'a'.repeat(30)]])(
    'disables missing or invalid configuration %s', (url, key) => expect(isSupabaseConfigured(url, key)).toBe(false));
  it('accepts a configured HTTPS endpoint and public key', () => {
    expect(isSupabaseConfigured('https://project.supabase.co', 'sb_publishable_12345678901234567890')).toBe(true);
  });
});

describe('Auth callback boundary', () => {
  it.each(['https://evil.example/auth/reset-password', 'other://auth/reset-password',
    'ultraedge://evil/auth/reset-password', 'ultraedge://auth/reset-password/extra',
    'ultraedge://auth/reset-password-evil', 'ultraedge://user@auth/reset-password',
    'ultraedge://auth:8080/reset-password', 'ultraedge://auth/callback'])('rejects unrelated destinations %s', url => {
    expect(parseAuthCallback(url, 'reset-password')).toBeNull();
  });
  it('accepts exact registered destinations and parses PKCE codes', () => {
    expect(parseAuthCallback('ultraedge://auth/reset-password?code=example-code', 'reset-password')?.get('code')).toBe('example-code');
  });
  it('rejects ambiguous parameters across fragment and query', () => {
    expect(parseAuthCallback('ultraedge://auth/reset-password?code=one#code=two', 'reset-password')).toBeNull();
    expect(parseAuthCallback('ultraedge://auth/reset-password#code=one&code=two', 'reset-password')).toBeNull();
  });
  it('accepts recovery token pairs, but rejects wrong types, errors and malformed tokens', () => {
    const params = new URLSearchParams('type=recovery&access_token=header.payload.signature&refresh_token=refresh-token-123');
    expect(recoveryTokens(params)?.refresh_token).toBe('refresh-token-123');
    params.set('type', 'signup');
    expect(recoveryTokens(params)).toBeNull();
    params.set('type', 'recovery'); params.set('error', 'expired');
    expect(recoveryTokens(params)).toBeNull();
    params.delete('error'); params.set('access_token', 'not-a-token');
    expect(recoveryTokens(params)).toBeNull();
  });
});
