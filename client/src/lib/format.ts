const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** "12.3" → 1230. Input must already match /^\d+(\.\d{1,2})?$/. */
export function dollarsToCents(input: string): number {
  const [dollars, cents = ''] = input.split('.');
  return Number(dollars) * 100 + Number((cents + '00').slice(0, 2));
}
