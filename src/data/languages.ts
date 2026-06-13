import type { LangCode, LangInfo } from '../types';

// --- Commentary sources ---------------------------------------------------
export const LANGS: Record<LangCode, LangInfo> = {
  en: { label: 'EN', name: 'English', source: 'FIFA · YouTube', short: 'FIFA' },
  es: { label: 'ES', name: 'Español', source: 'Telemundo · YouTube', short: 'Telemundo' },
  nl: { label: 'NL', name: 'Nederlands', source: 'NOS · nos.nl', short: 'NOS' },
};

export const LANG_ORDER: LangCode[] = ['en', 'es', 'nl'];
