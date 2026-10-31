import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HttpOptions } from '@capacitor/core';

const user = {
  id: 9, name: 'Native Test', email: 'native@example.test',
  role: 'student', account_status: 'active', email_verified_at: null,
};
let storedToken: string | null = null;
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: () => storedToken,
    setItem: (_key: string, value: string) => { storedToken = value; },
    removeItem: () => { storedToken = null; },
  },
});
Object.defineProperty(globalThis, 'androidBridge', { configurable: true, value: {} });
Object.defineProperty(globalThis, 'Capacitor', {
  configurable: true,
  writable: true,
  value: {
    PluginHeaders: [{ name: 'CapacitorHttp', methods: [{ name: 'request', rtype: 'promise' }] }],
    nativePromise: async (plugin: string, method: string, options: HttpOptions) => {
      assert.equal(plugin, 'CapacitorHttp');
      assert.equal(method, 'request');
      assert.equal(options.url, 'http://10.0.2.2:8000/api/v1/auth/login');
      assert.equal(options.method, 'POST');
      assert.equal(options.connectTimeout, 10000);
      assert.equal(options.readTimeout, 15000);
      assert.deepEqual(options.data, { email: user.email, password: 'StrongPass123!' });
      return { status: 200, data: { success: true, data: { user, token: '9|native-secret' } }, headers: {} };
    },
  },
});

const { authApi } = await import('../src/services/api');
test('native login passes through the Capacitor native HTTP bridge', async () => {
  globalThis.fetch = async () => { throw new Error('browser fetch must not be used'); };
  assert.deepEqual(await authApi.login(user.email, 'StrongPass123!'), user);
  assert.equal(authApi.getToken(), '9|native-secret');
});
