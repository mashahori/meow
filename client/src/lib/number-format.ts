export function formatNumberWithSpaceGrouping(
  value: string | number,
  locale: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options)
    .formatToParts(Number(value))
    .map((part) => (part.type === 'group' ? ' ' : part.value))
    .join('');
}
