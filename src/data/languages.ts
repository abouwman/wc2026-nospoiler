import type { LangCode, LangInfo, Match, Track, Variant } from '../types';

// --- Commentary sources ---------------------------------------------------
export const LANGS: Record<LangCode, LangInfo> = {
  en: { label: 'EN', name: 'English', source: 'FIFA / FOX · YouTube', short: 'FIFA' },
  nl: { label: 'NL', name: 'Nederlands', source: 'NOS Sport · YouTube', short: 'NOS' },
};

export const LANG_ORDER: LangCode[] = ['en', 'nl'];

const VARIANT_ORDER: Variant[] = ['short', 'extended'];

// Flatten a match's clips into the individual playable tracks, in display order.
export function tracksOf(match: Match): Track[] {
  const out: Track[] = [];
  for (const lang of LANG_ORDER) {
    const clips = match.videos[lang];
    if (!clips) continue;
    for (const variant of VARIANT_ORDER) {
      const source = clips[variant];
      if (source) out.push({ lang, variant, source, key: lang + ':' + variant });
    }
  }
  return out;
}
