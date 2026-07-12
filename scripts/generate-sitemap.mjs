#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteUrl = (process.env.SITE_URL || 'https://rubycon.fi').replace(/\/$/, '');
const basePath = process.env.BASE_PATH || '/';
const lastmod = new Date().toISOString().slice(0, 10);

const locales = ['en', 'pl', 'fi'];
const defaultLocale = 'en';

function getLocalePath(locale) {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

  if (locale === defaultLocale) {
    return normalizedBase === '/' ? '/' : normalizedBase;
  }

  return `${normalizedBase}${locale}/`;
}

function getLocaleUrl(locale) {
  const path = getLocalePath(locale);

  if (path === '/') {
    return `${siteUrl}/`;
  }

  return `${siteUrl}${path.endsWith('/') ? path.slice(0, -1) : path}/`;
}

function getPrivacyPath(locale) {
  const home = getLocalePath(locale);

  if (home === '/') {
    return '/privacy/';
  }

  return `${home}privacy/`;
}

function getPrivacyUrl(locale) {
  const path = getPrivacyPath(locale);
  return `${siteUrl}${path.endsWith('/') ? path.slice(0, -1) : path}/`;
}

const localeUrls = Object.fromEntries(locales.map((locale) => [locale, getLocaleUrl(locale)]));

function buildAlternateLinks(urlsByLocale) {
  const languageLinks = locales
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${alt}" href="${urlsByLocale[alt]}" />`,
    )
    .join('\n');

  return `${languageLinks}
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlsByLocale[defaultLocale]}" />`;
}

function buildUrlEntry(loc, urlsByLocale, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
${buildAlternateLinks(urlsByLocale)}
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const homeEntries = locales.map((locale) =>
  buildUrlEntry(localeUrls[locale], localeUrls, locale === defaultLocale ? '1.0' : '0.9'),
);

const privacyUrls = Object.fromEntries(
  locales.map((locale) => [locale, getPrivacyUrl(locale)]),
);
const privacyEntries = locales.map((locale) =>
  buildUrlEntry(privacyUrls[locale], privacyUrls, '0.4'),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${homeEntries.join('\n')}
${privacyEntries.join('\n')}
  <url>
    <loc>${siteUrl}/llms.txt</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`;

const outputPath = join(root, 'public', 'sitemap.xml');
writeFileSync(outputPath, xml, 'utf8');
console.log(
  `Generated ${outputPath} (${locales.length * 2 + 1} URLs, lastmod ${lastmod})`,
);
