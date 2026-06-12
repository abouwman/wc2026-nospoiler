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
export type MatchStatus = 'played' | 'today' | 'upcoming';

export interface Match {
  id: string;
  num: number;
  stage: Stage;
  group?: string;
  dayIdx: number;
  home: string | null;
  away: string | null;
  homeLabel?: string;
  awayLabel?: string;
  venue: string;
  time: string;
  status: MatchStatus;
  langs: LangCode[];
  played: boolean;
}

export type Mode = 'light' | 'dark';
export type Tab = 'highlights' | 'schedule';
export type StageFilter = 'all' | Stage;
