import { describe, expect, it } from 'vitest';
import { isoDateToLocalDate, localDateToIsoDate } from './date';

describe('isoDateToLocalDate', () => {
  it('builds a local-midnight Date whose parts match the string', () => {
    const date = isoDateToLocalDate('2026-08-24');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(24);
  });
});

describe('localDateToIsoDate', () => {
  it('formats from local parts with zero padding', () => {
    expect(localDateToIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('round trip', () => {
  // toISOString would shift these across timezones; local-parts conversion must not.
  it.each(['2026-08-24', '2026-01-01', '2026-12-31', '2028-02-29'])(
    'string → Date → string is exact for %p',
    (iso) => {
      expect(localDateToIsoDate(isoDateToLocalDate(iso))).toBe(iso);
    },
  );
});
