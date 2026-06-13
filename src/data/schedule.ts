import type { Match, Stage } from '../types';

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

// Real FIFA World Cup 2026 matches that have already been played (played-only —
// no upcoming or in-progress fixtures).
//   EN → FIFA's own highlight (fifa.com watch id). Played in FIFA's embed when a
//        partner credential is set (data/sources.ts); otherwise opens on fifa.com.
//   NL → NOS Sport's Dutch summary on YouTube (@nossport).
//   ES → no non-YouTube Spanish source provided, so it stays unavailable (🚫).
// Add new matches to the top as they finish.
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
      en: { kind: 'fifa', id: '5ekSKA6XJZqv9Fag9pI7sH' },
      nl: { kind: 'youtube', id: 'JepkqjGbVa4' },
    },
  },
  {
    id: 'm-mex-rsa', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'MEX', away: 'RSA', venue: 'Estadio Azteca · Mexico City',
    videos: {
      en: { kind: 'fifa', id: '7wv3jFr0T2wczSuQbhgrSW' },
      nl: { kind: 'youtube', id: 'axQsKUBbRiU' },
    },
  },
  {
    id: 'm-kor-cze', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'KOR', away: 'CZE', venue: 'Estadio Akron · Guadalajara',
    videos: {
      en: { kind: 'fifa', id: '1iidGe97khg8lmdSRopdh4' },
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
