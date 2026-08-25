const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** An unsigned dollar amount with at most two decimal places. */
export const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** "12.3" → 1230. Input must already match AMOUNT_RE. */
export function dollarsToCents(input: string): number {
  const [dollars, cents = ''] = input.split('.');
  return Number(dollars) * 100 + Number((cents + '00').slice(0, 2));
}
