import type { Match, Stage } from '../types';

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

// Real FIFA World Cup 2026 matches that have already been played (played-only —
// no upcoming or in-progress fixtures). Each language carries that broadcaster's
// official highlight from their YouTube channel: EN from FIFA, ES from Telemundo
// Deportes. NOS (NL) publishes its WK summaries on nos.nl / NPO Start rather
// than YouTube, so the Dutch source isn't embeddable here yet — it shows as
// unavailable on the card. Add new matches to the top as they finish.
export const MATCHES: Match[] = [
  {
    id: 'm-usa-par', stage: 'group', group: 'D', date: '2026-06-13',
    home: 'USA', away: 'PAR', venue: 'SoFi Stadium · Los Angeles',
    videos: { en: 'BXD1_mhODBU', es: '8AAIyuxp9gA' },
  },
  {
    id: 'm-can-bih', stage: 'group', group: 'B', date: '2026-06-12',
    home: 'CAN', away: 'BIH', venue: 'BMO Field · Toronto',
    videos: { en: 'cPwJaA22gWc', es: 'mdeGQLhkPBM' },
  },
  {
    id: 'm-mex-rsa', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'MEX', away: 'RSA', venue: 'Estadio Azteca · Mexico City',
    videos: { en: 'r1Afsds3ZD0', es: 'OEHW4OMwYoE' },
  },
  {
    id: 'm-kor-cze', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'KOR', away: 'CZE', venue: 'Estadio Akron · Guadalajara',
    videos: { en: 'QWoDfCkh7f8', es: 'ztKvwczBmqk' },
  },
];

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
