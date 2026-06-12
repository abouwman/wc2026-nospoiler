import type { LangCode, LangInfo } from '../types';

// --- Commentary sources ---------------------------------------------------
export const LANGS: Record<LangCode, LangInfo> = {
  en: { label: 'EN', name: 'English', source: 'ESPN · YouTube', short: 'ESPN' },
  es: { label: 'ES', name: 'Español', source: 'Telemundo · YouTube', short: 'Telemundo' },
  nl: { label: 'NL', name: 'Nederlands', source: 'NOS · nos.nl', short: 'NOS' },
};

export const LANG_ORDER: LangCode[] = ['en', 'es', 'nl'];

// Stand-in embeddable videos (Blender open movies) — swap for real highlight
// URLs per source in production.
export const VIDEO_POOL = ['aqz-KE-bpKQ', 'eRsGyueVLvQ', 'R6MlUcmOul8', 'WhWc3b3KhnY', 'SkVqJ1SGeL0'];

// --- Helpers ---------------------------------------------------------------
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function videoFor(matchId: string, lang: LangCode): string {
  return VIDEO_POOL[hash(matchId + ':' + lang) % VIDEO_POOL.length];
}
