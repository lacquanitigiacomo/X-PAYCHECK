import { describe, expect, it } from 'vitest';
import { createEmptyWeek, updateWorkDay } from './schedule';

describe('weekly onboarding schedule', () => {
  it('creates Monday through Sunday exactly once', () => {
    expect(createEmptyWeek().map((item) => item.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('clears times when a day is disabled', () => {
    const result = updateWorkDay(createEmptyWeek(), 1, { enabled: false });

    expect(result[0]).toMatchObject({ enabled: false, start: null, end: null });
  });
});
