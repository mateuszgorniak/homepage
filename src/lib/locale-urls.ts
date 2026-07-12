import { defaultLocale, type Locale, locales } from '../i18n';

export type SitePage = 'home' | 'privacy';

export const ogLocaleCodes: Record<Locale, string> = {
  en: 'en_US',
  pl: 'pl_PL',
  fi: 'fi_FI',
};

export function getLocalePath(locale: Locale, basePath = '/'): string {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

  if (locale === defaultLocale) {
    return normalizedBase === '/' ? '/' : normalizedBase;
  }

  return `${normalizedBase}${locale}/`;
}

export function getLocaleUrl(siteUrl: string, locale: Locale, basePath = '/'): string {
  const origin = siteUrl.replace(/\/$/, '');
  const path = getLocalePath(locale, basePath);

  if (path === '/') {
    return `${origin}/`;
  }

  return `${origin}${path.endsWith('/') ? path.slice(0, -1) : path}/`;
}

export function getAllLocaleUrls(siteUrl: string, basePath = '/'): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, getLocaleUrl(siteUrl, locale, basePath)]),
  ) as Record<Locale, string>;
}

export function getHomeSectionPath(
  locale: Locale,
  sectionId: string,
  basePath = '/',
): string {
  const home = getLocalePath(locale, basePath);
  const hash = `#${sectionId}`;

  if (home === '/') {
    return `/${hash}`;
  }

  return `${home}${hash}`;
}

export function getHomeSectionUrl(
  siteUrl: string,
  locale: Locale,
  sectionId: string,
  basePath = '/',
): string {
  return new URL(getHomeSectionPath(locale, sectionId, basePath), siteUrl).href;
}

export function getHomeUrl(siteUrl: string, locale: Locale, basePath = '/'): string {
  const homePath = getLocalePath(locale, basePath);
  return new URL(`${homePath}#top`, siteUrl).href;
}

export function getPrivacyPath(locale: Locale, basePath = '/'): string {
  const home = getLocalePath(locale, basePath);

  if (home === '/') {
    return '/privacy/';
  }

  return `${home}privacy/`;
}

export function getPrivacyUrl(siteUrl: string, locale: Locale, basePath = '/'): string {
  return new URL(getPrivacyPath(locale, basePath), siteUrl).href;
}

export function getAllPrivacyUrls(siteUrl: string, basePath = '/'): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, getPrivacyUrl(siteUrl, locale, basePath)]),
  ) as Record<Locale, string>;
}

export function detectSitePage(pathname: string): SitePage {
  const normalized = pathname.replace(/\/index\.html$/, '');

  if (normalized.includes('/privacy')) {
    return 'privacy';
  }

  return 'home';
}

export function getPagePath(
  locale: Locale,
  page: SitePage,
  basePath = '/',
): string {
  if (page === 'privacy') {
    return getPrivacyPath(locale, basePath);
  }

  return getLocalePath(locale, basePath);
}

export function getLanguageSwitcherPath(
  targetLocale: Locale,
  page: SitePage,
  basePath = '/',
): string {
  return getPagePath(targetLocale, page, basePath);
}

export function getLanguageSwitcherUrl(
  siteUrl: string,
  targetLocale: Locale,
  page: SitePage,
  basePath = '/',
): string {
  return new URL(getPagePath(targetLocale, page, basePath), siteUrl).href;
}
