import { useEffect, useMemo, useState } from 'react';
import { appLabels } from '../copy';
import { initialSettings } from '../mockData';
import type { I18nState } from '../types/app';
import type { Locale, TranslationParams } from '../types/domain';

const labels = appLabels as Record<Locale, Record<string, string>>;

function isLocale(value: string | null): value is Locale {
  return Boolean(value && labels[value as Locale]);
}

function getInitialLocale(): Locale {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  let stored: string | null = initialSettings.defaultLocale;

  try {
    stored = window.localStorage.getItem('cr-locale') || initialSettings.defaultLocale;
  } catch {
    stored = initialSettings.defaultLocale;
  }

  if (isLocale(requested)) return requested;
  if (isLocale(stored)) return stored;
  return 'id';
}

export function useI18n(): I18nState {
  const [locale, setLocaleState] = useState(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem('cr-locale', locale);
    } catch {
      // Browser storage can be disabled in previews; labels still resolve from memory.
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, values: TranslationParams = {}) => {
      const template = labels[locale]?.[key] ?? labels.id?.[key] ?? key;
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      );
    };
  }, [locale]);

  const setLocale: I18nState['setLocale'] = (value) => {
    const nextLocale = typeof value === 'function' ? value(locale) : value;
    if (!labels[nextLocale]) return;
    setLocaleState(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLocale);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return { locale, setLocale, t };
}
