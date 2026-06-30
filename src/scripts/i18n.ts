import type { Locale } from '../i18n';

type TranslationTree = Record<string, unknown>;

function getNestedValue(obj: TranslationTree, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as TranslationTree)[part];
  }

  return current;
}

function detectLocale(): Locale {
  const stored = localStorage.getItem('locale');
  if (stored === 'en' || stored === 'pl' || stored === 'fi') return stored;

  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'pl') return 'pl';
  if (browserLang === 'fi') return 'fi';
  return 'en';
}

function applyTranslations(locale: Locale): void {
  const data = (window as Window & { __i18n?: Record<Locale, TranslationTree> }).__i18n;
  if (!data?.[locale]) return;

  const translations = data[locale];

  document.documentElement.lang = locale;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;

    const value = getNestedValue(translations, key);
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  document.title = (getNestedValue(translations, 'meta.title') as string) ?? document.title;

  const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  const description = getNestedValue(translations, 'meta.description');
  if (metaDescription && typeof description === 'string') {
    metaDescription.content = description;
  }

  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    const isActive = btn.dataset.locale === locale;
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

export function getActiveLocale(): Locale {
  return detectLocale();
}

export function initI18n(): void {
  const locale = detectLocale();
  applyTranslations(locale);

  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.locale as Locale | undefined;
      if (!next) return;

      localStorage.setItem('locale', next);
      applyTranslations(next);
      document.dispatchEvent(new CustomEvent('localechange', { detail: { locale: next } }));
    });
  });
}
