import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';
import { getMessages as loadMessages } from '@/i18n/getMessages';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  let resolved: Locale = defaultLocale;
  if (isLocale(cookieLocale)) resolved = cookieLocale;
  else {
    const accept = (await headers()).get('accept-language') || '';
    const preferred = accept
      .split(',')
      .map((s: string) => s.trim().split(';')[0])[0];
    const short = preferred?.slice(0, 2).toLowerCase();
    if (isLocale(short)) resolved = short;
  }
  const messages = await loadMessages(resolved);
  return { locale: resolved, messages };
});
