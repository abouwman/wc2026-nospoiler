import type { Match, Stage } from '../types';
import generated from './matches.generated.json';

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

// Played matches with their highlight sources. This file is maintained
// automatically by scripts/update-highlights.mjs (run from a scheduled GitHub
// Action), which appends new matches as their highlights appear on YouTube.
export const MATCHES = generated as unknown as Match[];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fmtDay(iso: string): string {
  return parseDate(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export function fmtDayShort(iso: string): string {
  return parseDate(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

/** Kickoff instant rendered in the viewer's own local time zone. */
export function fmtKickoffLocal(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** A match is upcoming if its kickoff is still in the future. */
export function isUpcoming(m: Match, now: number = Date.now()): boolean {
  return !!m.kickoff && new Date(m.kickoff).getTime() > now;
}

/** Local calendar day (YYYY-MM-DD in the viewer's own time zone) a match belongs
 *  to. A match kicking off at 00:00 local time falls on that new day. Falls back
 *  to the stored UTC date when no exact kickoff is known. */
export function localDayKey(m: Match): string {
  if (!m.kickoff) return m.date;
  const d = new Date(m.kickoff);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Sort instant for ordering matches within a day (exact kickoff when known,
 *  otherwise the day's start). */
export function matchInstant(m: Match): number {
  if (m.kickoff) return new Date(m.kickoff).getTime();
  const [y, mo, d] = m.date.split('-').map(Number);
  return Date.UTC(y, mo - 1, d);
}

export function hasAnyVideo(m: Match): boolean {
  return Object.values(m.videos).some((c) => c && (c.short || c.extended));
}

/** Any playable/linkable source (YouTube clips or an external highlight link). */
export function hasAnySource(m: Match): boolean {
  return hasAnyVideo(m) || !!m.fifa || !!m.bbc;
}

export const FIFA_HIGHLIGHTS_HUB =
  'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/highlights';

/** Match-specific FIFA watch page when known, else the highlights hub. */
export function fifaUrl(m: Match): string {
  return m.fifa ? 'https://www.fifa.com/en/watch/' + m.fifa : FIFA_HIGHLIGHTS_HUB;
}

/** Match-specific BBC iPlayer episode (UK only). */
export function bbcUrl(m: Match): string {
  return 'https://www.bbc.co.uk/iplayer/episode/' + m.bbc;
}
