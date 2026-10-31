import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { Capacitor } from '@capacitor/core';
import { ApiError, authApi, resolveApiBaseUrl } from '../src/services/api';

const originalFetch = globalThis.fetch;
const originalNative = Capacitor.isNativePlatform;
const memory = new Map<string, string>();
const user = {
  id: 7, name: 'Connection Test', email: 'connection@example.test',
  role: 'owner', account_status: 'active', email_verified_at: null,
};

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  });
  Capacitor.isNativePlatform = () => false;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  Capacitor.isNativePlatform = originalNative;
});

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, message: 'OK', data }), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

test('browser uses the same-origin proxy; native requires an absolute endpoint', () => {
  assert.equal(resolveApiBaseUrl(undefined, false), '/api/v1');
  assert.equal(resolveApiBaseUrl('  /api/v1/// ', false), '/api/v1');
  assert.equal(resolveApiBaseUrl(undefined, true), 'http://10.0.2.2:8000/api/v1');
  assert.equal(resolveApiBaseUrl('https://rentph.example/api/v1/', true), 'https://rentph.example/api/v1');
  assert.throws(() => resolveApiBaseUrl('/api/v1', true), /absolute HTTP/);
});

test('registration forwards confirmed password and owner role, and accepts a valid token', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/register');
    assert.equal(options?.method, 'POST');
    assert.equal(new Headers(options?.headers).get('Authorization'), null);
    assert.deepEqual(JSON.parse(String(options?.body)), {
      name: user.name, email: user.email, password: 'StrongPass123!',
      password_confirmation: 'StrongPass123!', role: 'owner',
    });
    assert.ok(options?.signal);
    return response({ user, token: '7|test-secret' }, 201);
  };
  assert.deepEqual(await authApi.register(user.name, user.email, 'StrongPass123!', 'owner'), user);
  assert.equal(authApi.getToken(), '7|test-secret');
});

test('login and session lookup keep the bearer contract', async () => {
  globalThis.fetch = async url => {
    assert.equal(url, '/api/v1/auth/login');
    return response({ user, token: '7|test-secret' });
  };
  await authApi.login(user.email, 'StrongPass123!');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/me');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer 7|test-secret');
    return response({ user });
  };
  assert.deepEqual(await authApi.me(), user);
});

test('validation errors retain their status and first field message', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: false, message: 'The given data was invalid.',
    errors: { email: ['The email has already been taken.'] },
  }), { status: 422 });
  await assert.rejects(authApi.login(user.email, 'bad'), error =>
    error instanceof ApiError && error.status === 422 && error.message === 'The email has already been taken.');
});

test('malformed success data never persists an invalid session', async () => {
  globalThis.fetch = async () => response({ user, token: 'not-a-bearer-token' });
  await assert.rejects(authApi.login(user.email, 'StrongPass123!'), /invalid authentication data/);
  assert.equal(authApi.getToken(), null);
  globalThis.fetch = async () => response({ user: { ...user, role: 'superuser' }, token: '7|test-secret' });
  await assert.rejects(authApi.login(user.email, 'StrongPass123!'), /invalid account data/);
  assert.equal(authApi.getToken(), null);
});

test('network outage is distinct from an expired token and preserves stored credentials', async () => {
  memory.set('rentph_api_token', '7|test-secret');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(authApi.me(), error => error instanceof ApiError && error.status === 0);
  assert.equal(authApi.getToken(), '7|test-secret');
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: 'Unauthenticated.', errors: {} }), { status: 401 });
  await assert.rejects(authApi.me(), error => error instanceof ApiError && error.status === 401);
});

test('non-JSON proxy responses are reported explicitly', async () => {
  globalThis.fetch = async () => new Response('<html>Bad gateway</html>', { status: 502 });
  await assert.rejects(authApi.me(), error =>
    error instanceof ApiError && error.status === 502 && /non-JSON/.test(error.message));
});

test('logout revokes current token and clears local storage, including on failure', async () => {
  memory.set('rentph_api_token', '7|test-secret');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/logout');
    assert.equal(options?.method, 'POST');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer 7|test-secret');
    return response(null);
  };
  await authApi.logout();
  assert.equal(authApi.getToken(), null);
  memory.set('rentph_api_token', '7|test-secret');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(authApi.logout(), ApiError);
  assert.equal(authApi.getToken(), null);
});
