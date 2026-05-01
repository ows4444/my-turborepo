export function formatNumber(value: number, locale = "en-US", options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}
