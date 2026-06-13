import type { LangCode, LangInfo } from '../types';

// --- Commentary sources ---------------------------------------------------
export const LANGS: Record<LangCode, LangInfo> = {
  en: { label: 'EN', name: 'English', source: 'FIFA · YouTube', short: 'FIFA' },
  es: { label: 'ES', name: 'Español', source: 'Telemundo · YouTube', short: 'Telemundo' },
  nl: { label: 'NL', name: 'Nederlands', source: 'NOS · YouTube', short: 'NOS' },
};

export const LANG_ORDER: LangCode[] = ['en', 'es', 'nl'];

// --- Real World Cup 2026 highlight pools -----------------------------------
// Pulled from each source's YouTube channel (June 2026, group stage). Because
// the schedule above is sample data — not the real draw — clips are assigned to
// match cards deterministically rather than by actual teams, so a card's flags
// won't necessarily match the footage. Swap in a real fixture→video map once
// fixtures are real. NL note: NOS's tournament summaries live on nos.nl / NPO
// Start and aren't YouTube-embeddable, so the spoiler-shield player (which is
// built on the YouTube IFrame API) uses NOS's Dutch-commentary WK 2026
// samenvattingen that are available on YouTube.
const FIFA_EN = ['QWoDfCkh7f8', 'r1Afsds3ZD0', 'BXD1_mhODBU', 'lpDZwAxVkc4', 'cPwJaA22gWc', 'n5qkHOWhFAc'];
const TELEMUNDO_ES = ['OEHW4OMwYoE', 'ztKvwczBmqk', 'mdeGQLhkPBM', '8AAIyuxp9gA'];
const NOS_NL = ['mvFZ4VjnFaM', 'pa_O-K2mcSU', 'm94pNIIHygw', 'hUMGf7EsHeU', 'gZdGuDNbiDE', '9gFCGBPpuHk'];

export const VIDEO_POOLS: Record<LangCode, string[]> = {
  en: FIFA_EN,
  es: TELEMUNDO_ES,
  nl: NOS_NL,
};

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
  const pool = VIDEO_POOLS[lang];
  return pool[hash(matchId + ':' + lang) % pool.length];
}
