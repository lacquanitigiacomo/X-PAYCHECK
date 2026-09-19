import { describe, expect, it } from 'vitest';
import { loadServerConfig } from './config.js';

describe('loadServerConfig', () => {
  it('rejects missing production secrets', () => {
    expect(() => loadServerConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
  });

  it('accepts an explicit development secret', () => {
    expect(loadServerConfig({ NODE_ENV: 'development', JWT_SECRET: 'local-only' }).jwtSecret)
      .toBe('local-only');
  });
});
