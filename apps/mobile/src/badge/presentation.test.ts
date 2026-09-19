import { describe, expect, it } from 'vitest';
import { buildBadgeCorrection, formatElapsed } from './presentation';

describe('formatElapsed', () => {
  it('formats an open shift duration without wrapping after 24 hours', () => {
    expect(formatElapsed('2026-08-30T08:00:00.000Z', Date.parse('2026-08-31T10:02:03.000Z')))
      .toBe('26:02:03');
  });
});

describe('buildBadgeCorrection', () => {
  it('requires a meaningful correction reason', () => {
    expect(buildBadgeCorrection(
      '2026-08-31T08:00:00.000Z',
      '2026-08-31T16:00:00.000Z',
      '  ',
    )).toEqual({ ok: false, error: 'Inserisci una motivazione di almeno 3 caratteri.' });
  });

  it('rejects an end timestamp that is not after the start', () => {
    expect(buildBadgeCorrection(
      '2026-08-31T16:00:00.000Z',
      '2026-08-31T08:00:00.000Z',
      'Orari invertiti',
    )).toEqual({ ok: false, error: 'La fine deve essere successiva all’inizio.' });
  });

  it('builds a normalized correction when timestamps and reason are valid', () => {
    expect(buildBadgeCorrection(
      '2026-08-31T08:00:00.000Z',
      '2026-08-31T16:00:00.000Z',
      '  Turno corretto  ',
    )).toEqual({
      ok: true,
      value: {
        startedAt: '2026-08-31T08:00:00.000Z',
        endedAt: '2026-08-31T16:00:00.000Z',
        reason: 'Turno corretto',
      },
    });
  });
});
