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
