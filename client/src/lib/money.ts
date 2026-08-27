// The only module that knows amounts are integer cents behind dollar strings.

/** An unsigned dollar amount with at most two decimal places. */
export const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** "12.3" → 1230. Input must already match AMOUNT_RE. */
export function dollarsToCents(input: string): number {
  const [dollars, cents = ''] = input.split('.');
  return Number(dollars) * 100 + Number((cents + '00').slice(0, 2));
}

/** 1230 → "12.30" — a plain fixed-2 string, the exact inverse of dollarsToCents. */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
