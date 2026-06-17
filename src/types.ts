export interface Team {
  name: string;
  flag: string;
  /** [panel base, diagonal slash] — drawn from each flag/kit */
  colors: [string, string];
}

export type LangCode = 'en' | 'nl';
export type Variant = 'short' | 'extended';

export interface LangInfo {
  label: string;
  name: string;
  source: string;
  short: string;
}

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

// A highlight clip on YouTube. `geo` flags a viewing restriction (US- or NL-only).
export interface VideoSource {
  id: string;
  geo?: 'US' | 'NL';
}

// Each language can offer a short cut and/or an extended cut.
export type Clips = Partial<Record<Variant, VideoSource>>;

export interface Match {
  id: string;
  stage: Stage;
  group?: string;
  /** ISO calendar day of kickoff, 'YYYY-MM-DD' (UTC). */
  date: string;
  /** Exact kickoff instant (ISO 8601, e.g. '2026-06-13T22:00:00Z'); used for
   *  local-time display and the upcoming/played distinction. */
  kickoff?: string;
  home: string;
  away: string;
  /** Optional — auto-discovered matches may not know the venue. */
  venue?: string;
  /** Per-language clips. A missing language has no source yet. */
  videos: Partial<Record<LangCode, Clips>>;
  /** FIFA watch id for the International (fifa.com) link, when known. */
  fifa?: string;
  /** BBC iPlayer episode id for the UK-only highlights, when known. */
  bbc?: string;
  /** Full-match replay + international highlights embedded from timesoccertv.com. */
  tstv?: Tstv;
}

// Full match replay (per half) and extended highlights, embedded from
// timesoccertv.com. `page` is the source article, shown as credit.
export interface Tstv {
  page: string;
  /** Ordered full-match embed URLs, e.g. [1st half, 2nd half]. */
  full?: string[];
  /** Extended-highlights embed URL. */
  highlights?: string;
}

// A single playable selection (one language + one cut), used by cards and player.
export interface Track {
  lang: LangCode;
  variant: Variant;
  source: VideoSource;
  key: string;
}

export type Mode = 'light' | 'dark';
