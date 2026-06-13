export interface Team {
  name: string;
  flag: string;
  /** [panel base, diagonal slash] — drawn from each flag/kit */
  colors: [string, string];
}

export type LangCode = 'en' | 'es' | 'nl';

export interface LangInfo {
  label: string;
  name: string;
  source: string;
  short: string;
}

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

// A highlight comes either from YouTube (NOS Sport) or FIFA's own player.
export type VideoSource =
  | { kind: 'youtube'; id: string }   // YouTube video id (spoiler-shield player)
  | { kind: 'fifa'; id: string };     // FIFA watch id, played in FIFA's embed

export interface Match {
  id: string;
  stage: Stage;
  group?: string;
  /** ISO calendar day of kickoff, 'YYYY-MM-DD' (UTC). */
  date: string;
  home: string;
  away: string;
  venue: string;
  /** Per-language highlight source. A missing language has no source yet. */
  videos: Partial<Record<LangCode, VideoSource>>;
}

export type Mode = 'light' | 'dark';
