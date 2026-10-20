/** "31.10.2026" for an ISO calendar date; fixed to UTC so the day never shifts with the device's time zone. */
export function shortDate(iso: string, lang: 'tr' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

/** "4,7" in Turkish, "4.7" in English. */
export const ratingText = (rating: number, lang: 'tr' | 'en'): string => new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating);
