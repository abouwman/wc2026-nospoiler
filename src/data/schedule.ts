import type { Match, Stage } from '../types';

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

// Real FIFA World Cup 2026 matches that have already been played (played-only —
// no upcoming or in-progress fixtures).
//   EN → FIFA / FOX highlights on YouTube, in a short and an extended cut. These
//        are geo-restricted to the United States (geo: 'US').
//   NL → NOS Sport's Dutch summary on YouTube (@nossport).
//   ES → no non-YouTube Spanish source provided, so it stays unavailable (🚫).
// Add new matches to the top as they finish.
export const MATCHES: Match[] = [
  {
    id: 'm-usa-par', stage: 'group', group: 'D', date: '2026-06-13',
    home: 'USA', away: 'PAR', venue: 'SoFi Stadium · Los Angeles',
    videos: {
      en: { short: { id: 'BXD1_mhODBU', geo: 'US' }, extended: { id: 'lpDZwAxVkc4', geo: 'US' } },
      nl: { short: { id: '8MOpqhfo1dE', geo: 'NL' } },
    },
  },
  {
    id: 'm-can-bih', stage: 'group', group: 'B', date: '2026-06-12',
    home: 'CAN', away: 'BIH', venue: 'BMO Field · Toronto',
    videos: {
      en: { short: { id: 'n5qkHOWhFAc', geo: 'US' }, extended: { id: 'cPwJaA22gWc', geo: 'US' } },
      nl: { short: { id: 'JepkqjGbVa4', geo: 'NL' } },
    },
  },
  {
    id: 'm-mex-rsa', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'MEX', away: 'RSA', venue: 'Estadio Azteca · Mexico City',
    videos: {
      en: { short: { id: 'r1Afsds3ZD0', geo: 'US' }, extended: { id: 'PmevGCkUtM8', geo: 'US' } },
      nl: { short: { id: 'axQsKUBbRiU', geo: 'NL' } },
    },
  },
  {
    id: 'm-kor-cze', stage: 'group', group: 'A', date: '2026-06-11',
    home: 'KOR', away: 'CZE', venue: 'Estadio Akron · Guadalajara',
    videos: {
      en: { short: { id: 'QWoDfCkh7f8', geo: 'US' }, extended: { id: '6k18EJY8zIc', geo: 'US' } },
      nl: { short: { id: '84RGrVxrRF4', geo: 'NL' } },
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
