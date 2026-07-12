import type { Locale, Translations } from '../i18n';
import {
  BUSINESS_ID,
  CONTACT_EMAIL,
  LINKEDIN_URL,
  PERSON_JOB_TITLE,
  PORTRAIT_PATH,
  SITE_LOGO_PATH,
  YTJ_URL,
} from '../config/site';

export function buildStructuredData(
  t: Translations,
  siteUrl: string,
  locale: Locale,
  pageUrl: string,
) {
  const base = siteUrl.replace(/\/$/, '');
  const includeFaq = !pageUrl.includes('/privacy');

  const knowsAbout = [
    ...new Set([
      ...t.expertise.items.map((item) => item.name),
      ...t.stack.primary.map((item) => item.name),
      ...t.seo.knowsAbout,
    ]),
  ];

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: `${base}/`,
      name: 'RubyCon',
      description: t.meta.description,
      inLanguage: ['en', 'pl', 'fi'],
      publisher: { '@id': `${base}/#business` },
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: t.meta.title,
      description: t.meta.description,
      inLanguage: locale,
      isPartOf: { '@id': `${base}/#website` },
    },
    {
      '@type': 'ProfessionalService',
      '@id': `${base}/#business`,
      name: 'RubyCon',
      alternateName: 'Mateusz Górniak',
      url: `${base}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${base}${SITE_LOGO_PATH}`,
        width: 512,
        height: 512,
      },
      description: t.meta.description,
      email: CONTACT_EMAIL,
      identifier: BUSINESS_ID,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FI',
      },
      areaServed: [
        { '@type': 'Country', name: 'Finland' },
        { '@type': 'AdministrativeArea', name: 'European Union' },
      ],
      serviceType: t.services.items.map((item) => item.title),
      knowsAbout,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: t.services.title,
        itemListElement: t.services.items.map((item, index) => ({
          '@type': 'Offer',
          position: index + 1,
          itemOffered: {
            '@type': 'Service',
            name: item.title,
            description: item.summary,
          },
        })),
      },
      founder: { '@id': `${base}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${base}/#person`,
      name: 'Mateusz Górniak',
      jobTitle: PERSON_JOB_TITLE,
      description: t.about.lead,
      email: CONTACT_EMAIL,
      url: `${base}/`,
      image: `${base}${PORTRAIT_PATH}`,
      worksFor: { '@id': `${base}/#business` },
      sameAs: [LINKEDIN_URL, YTJ_URL],
      knowsAbout: t.expertise.items.map((item) => item.name),
    },
  ];

  if (includeFaq) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      url: `${pageUrl}#faq`,
      inLanguage: locale,
      isPartOf: { '@id': `${pageUrl}#webpage` },
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
