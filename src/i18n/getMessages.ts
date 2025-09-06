import { type Locale } from './config';

export async function getMessages(locale: Locale) {
  switch (locale) {
    case 'lt':
      return (await import('@/messages/lt.json')).default;
    case 'ru':
      return (await import('@/messages/ru.json')).default;
    case 'en':
    default:
      return (await import('@/messages/en.json')).default;
  }
}
