export interface Team {
  name: string;
  flag: string;
  /** [panel base, diagonal slash] — drawn from each flag/kit */
  colors: [string, string];
}

export type LangCode = 'en' | 'es' | 'nl';
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
  home: string;
  away: string;
  venue: string;
  /** Per-language clips. A missing language has no source yet. */
  videos: Partial<Record<LangCode, Clips>>;
}

// A single playable selection (one language + one cut), used by cards and player.
export interface Track {
  lang: LangCode;
  variant: Variant;
  source: VideoSource;
  key: string;
}

export type Mode = 'light' | 'dark';
