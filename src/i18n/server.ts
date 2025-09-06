import { cookies, headers } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from './config';

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  const accept = (await headers()).get('accept-language') || '';
  const preferred = accept.split(',').map((s) => s.trim().split(';')[0])[0];
  const short = preferred?.slice(0, 2).toLowerCase();
  if (isLocale(short)) return short;
  return defaultLocale;
}
