import type { Match, Stage } from '../types';

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

// Real FIFA World Cup 2026 matches that have already been played (played-only —
// no upcoming or in-progress fixtures).
//   EN → FIFA's own highlight (played in FIFA's embed; fifa.com watch id).
//   NL → NOS Sport's Dutch summary on YouTube (@nossport).
//   ES → no non-YouTube Spanish source provided, so it stays unavailable (🚫).
// Only the USA–Paraguay FIFA watch id is known so far — the rest of the FIFA
// watch ids live on fifa.com, which is currently blocked by the environment's
// network egress allowlist, so EN shows as unavailable on those cards until the
// ids are added. Add new matches to the top as they finish.
export const MATCHES: Match[] = [
  {
    id: 'm-usa-par', stage: 'group', group: 'D', date: '2026-06-13',
    home: 'USA', away: 'PAR', venue: 'SoFi Stadium · Los Angeles',
    videos: {
      en: { kind: 'fifa', id: '6jzgitUqP6YyXpwwuY6VRc' },
      nl: { kind: 'youtube', id: '8MOpqhfo1dE' },
    },
  },
  {
    id: 'm-can-bih', stage: 'group', group: 'B', date: '2026-06-12',
    home: 'CAN', away: 'BIH', venue: 'BMO Field · Toronto',
    videos: {
      nl: { kind: 'youtube', id: 'JepkqjGbVa4' },
    },
  },
  {
    id: 'm-mex-rsa', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'MEX', away: 'RSA', venue: 'Estadio Azteca · Mexico City',
    videos: {
      nl: { kind: 'youtube', id: 'axQsKUBbRiU' },
    },
  },
  {
    id: 'm-kor-cze', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'KOR', away: 'CZE', venue: 'Estadio Akron · Guadalajara',
    videos: {
      nl: { kind: 'youtube', id: '84RGrVxrRF4' },
    },
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
