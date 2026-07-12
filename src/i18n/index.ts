import en from './en.json';
import pl from './pl.json';
import fi from './fi.json';

export type Locale = 'en' | 'pl' | 'fi';

export const locales: Locale[] = ['en', 'pl', 'fi'];

export type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, pl, fi };

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.en;
}

export const defaultLocale: Locale = 'en';
