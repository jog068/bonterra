// Conversions between the app's calendar-date strings (YYYY-MM-DD) and the
// Date objects the calendar widget needs. Always via local date parts —
// toISOString/Date-parsing would shift days across timezones.

export function isoDateToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
