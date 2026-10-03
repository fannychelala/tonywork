export function formatMoney(minorUnits: number, currency: string, locale: string): string {
 if (!Number.isSafeInteger(minorUnits)) throw new RangeError("Money must be a safe integer in minor units");
 const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
 const digits = formatter.resolvedOptions().maximumFractionDigits;
 if (digits === undefined) throw new RangeError("Currency precision unavailable");
 return formatter.format(minorUnits / 10 ** digits);
}
export function formatDate(date: Date, locale: string, timeZone: string): string {
 return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
}
