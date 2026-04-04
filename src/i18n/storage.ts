import type { Locale } from './types';

export const LOCALE_STORAGE_KEY = 'diggr-locale';

export function loadLocalePreference(): Locale {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    return 'en';
  }

  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  return raw === 'zh-CN' ? 'zh-CN' : 'en';
}

export function persistLocalePreference(locale: Locale): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(LOCALE_STORAGE_KEY, locale === 'zh-CN' ? 'zh-CN' : 'en');
}
