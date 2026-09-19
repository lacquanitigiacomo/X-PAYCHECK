import { describe, expect, it } from 'vitest';
import { encodeBytesToBase64 } from './fileEncoding';

describe('encodeBytesToBase64', () => {
  it('encodes bytes without spreading the full input on the call stack', () => {
    expect(encodeBytesToBase64(new Uint8Array([88, 45, 80, 65, 89]))).toBe('WC1QQVk=');
  });
});
