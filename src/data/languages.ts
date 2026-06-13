import type { LangCode, LangInfo } from '../types';

// --- Commentary sources ---------------------------------------------------
export const LANGS: Record<LangCode, LangInfo> = {
  en: { label: 'EN', name: 'English', source: 'FIFA · fifa.com', short: 'FIFA' },
  es: { label: 'ES', name: 'Español', source: 'Telemundo', short: 'Telemundo' },
  nl: { label: 'NL', name: 'Nederlands', source: 'NOS Sport · YouTube', short: 'NOS' },
};

export const LANG_ORDER: LangCode[] = ['en', 'es', 'nl'];
