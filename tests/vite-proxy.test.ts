import assert from 'node:assert/strict';
import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile } from 'vite';

test('Vite proxy reads .env, respects shell overrides, and falls back to local Go', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rentph-proxy-test-'));
  const envFile = join(directory, '.env');
  const originalDirectory = process.cwd();
  const originalTarget = process.env.API_PROXY_TARGET;
  const configPath = fileURLToPath(new URL('../vite.config.ts', import.meta.url));
  let hasEnvFile = false;

  const target = async () => {
    const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' }, configPath);
    const proxy = loaded?.config.server?.proxy?.['/api'];
    assert.ok(proxy && typeof proxy !== 'string');
    assert.equal(proxy.changeOrigin, true);
    return proxy.target;
  };

  try {
    await writeFile(envFile, 'API_PROXY_TARGET=http://127.0.0.1:8123\n');
    hasEnvFile = true;
    process.chdir(directory);
    delete process.env.API_PROXY_TARGET;
    assert.equal(await target(), 'http://127.0.0.1:8123');
    process.env.API_PROXY_TARGET = 'http://127.0.0.1:8999';
    assert.equal(await target(), 'http://127.0.0.1:8999');
    delete process.env.API_PROXY_TARGET;
    await unlink(envFile);
    hasEnvFile = false;
    assert.equal(await target(), 'http://127.0.0.1:8000');
  } finally {
    process.chdir(originalDirectory);
    if (originalTarget === undefined) delete process.env.API_PROXY_TARGET;
    else process.env.API_PROXY_TARGET = originalTarget;
    if (hasEnvFile) await unlink(envFile);
    await rmdir(directory);
  }
});
