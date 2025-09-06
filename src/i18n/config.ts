export const locales = ['en', 'lt', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(input: string | null | undefined): input is Locale {
  return !!input && (locales as readonly string[]).includes(input);
}
