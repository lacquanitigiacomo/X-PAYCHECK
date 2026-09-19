// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api';

describe('resolveApiBaseUrl', () => {
  it('punta al backend locale su localhost', () => {
    expect(resolveApiBaseUrl({ hostname: 'localhost', origin: 'http://localhost:5173' })).toBe(
      'http://localhost:3001/api/v1'
    );
  });

  it('punta al backend locale per qualsiasi host che non sia Codespaces', () => {
    expect(resolveApiBaseUrl({ hostname: '127.0.0.1', origin: 'http://127.0.0.1:5173' })).toBe(
      'http://localhost:3001/api/v1'
    );
  });

  it('sostituisce la porta del frontend con quella del backend su GitHub Codespaces', () => {
    const hostname = 'fooo-5173.app.github.dev';
    const origin = `https://${hostname}`;
    expect(resolveApiBaseUrl({ hostname, origin })).toBe('https://fooo-3001.app.github.dev/api/v1');
  });
});
