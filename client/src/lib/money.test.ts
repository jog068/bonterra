import { describe, expect, it } from 'vitest';
import { centsToDollars, dollarsToCents } from './money';

describe('dollarsToCents', () => {
  it.each([
    ['12.34', 1234],
    ['12.3', 1230],
    ['0.07', 7],
    ['3200.00', 320000],
    ['5', 500],
  ])('converts %p to %p cents', (input, expected) => {
    expect(dollarsToCents(input)).toBe(expected);
  });
});

describe('centsToDollars', () => {
  it.each([
    [1234, '12.34'],
    [1230, '12.30'],
    [7, '0.07'],
    [320000, '3200.00'],
    [500, '5.00'],
  ])('converts %p cents to %p', (input, expected) => {
    expect(centsToDollars(input)).toBe(expected);
  });
});

describe('round trip', () => {
  it.each([1, 7, 99, 100, 1230, 8875, 320000])(
    'cents → dollars → cents is exact for %p',
    (cents) => {
      expect(dollarsToCents(centsToDollars(cents))).toBe(cents);
    },
  );
});
