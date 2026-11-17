// Months are handled as "YYYY-MM" strings, the same format the statistics endpoint accepts.
function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getCurrentMonth(now: Date = new Date()): string {
  return formatMonthKey(now.getFullYear(), now.getMonth() + 1);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return formatMonthKey(Math.floor(index / 12), (index % 12) + 1);
}

export function formatMonthLabel(month: string, locale: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const label = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
