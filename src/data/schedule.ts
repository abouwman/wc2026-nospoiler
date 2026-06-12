import type { LangCode, Match, Stage } from '../types';
import { GROUPS, GROUP_LETTERS, TIMES, VENUES } from './teams';
import { hash } from './languages';

// dayIdx 0 = June 10, 2026. Tournament: Jun 11 (1) → Jul 19 (39).
export const DAY0 = Date.UTC(2026, 5, 10);

export function dateOf(dayIdx: number): Date {
  return new Date(DAY0 + dayIdx * 86400000);
}

export function fmtDay(dayIdx: number): string {
  return dateOf(dayIdx).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export function fmtDayShort(dayIdx: number): string {
  return dateOf(dayIdx).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
};

function langsFor(id: string, home: string, away: string): LangCode[] {
  const langs: LangCode[] = ['en', 'es'];
  if (home === 'NED' || away === 'NED' || hash(id + ':nl') % 3 === 0) langs.push('nl');
  return langs;
}

interface PushArgs {
  stage: Stage;
  group?: string;
  dayIdx: number;
  home?: string | null;
  away?: string | null;
  homeLabel?: string;
  awayLabel?: string;
}

type Feed = { team: string | null; label: string; match?: undefined }
  | { match: Match | null; team?: null; label: string; unresolved?: boolean };

// --- Schedule generator ----------------------------------------------------
// simDay: dayIdx of "today". A match is `played` if its dayIdx < simDay,
// `today` if equal, else `upcoming`.
export function build(simDay: number): Match[] {
  const matches: Match[] = [];
  let num = 0;

  function push(m: PushArgs): Match {
    num += 1;
    const id = 'm' + num;
    const status: Match['status'] = m.dayIdx < simDay ? 'played' : (m.dayIdx === simDay ? 'today' : 'upcoming');
    const venue = VENUES[hash(id + ':v') % VENUES.length];
    const time = TIMES[hash(id + ':t') % TIMES.length];
    const home = m.home ?? null;
    const away = m.away ?? null;
    const langs = home && away ? langsFor(id, home, away) : (['en', 'es'] as LangCode[]);
    const match: Match = {
      id, num, stage: m.stage, group: m.group, dayIdx: m.dayIdx,
      home, away, homeLabel: m.homeLabel, awayLabel: m.awayLabel,
      venue, time, status, langs, played: status === 'played',
    };
    matches.push(match);
    return match;
  }

  // Group stage — MD1 Jun 11–14, MD2 Jun 16–19, MD3 Jun 21–26
  const rounds = [
    { pairs: [[0, 1], [2, 3]], day: (g: number) => 1 + Math.floor(g / 3) },
    { pairs: [[0, 2], [1, 3]], day: (g: number) => 6 + Math.floor(g / 3) },
    { pairs: [[0, 3], [1, 2]], day: (g: number) => 11 + Math.floor(g / 2) },
  ];
  rounds.forEach((round) => {
    GROUP_LETTERS.forEach((letter, g) => {
      const teams = GROUPS[letter];
      round.pairs.forEach((p) => {
        push({ stage: 'group', group: letter, dayIdx: round.day(g), home: teams[p[0]], away: teams[p[1]] });
      });
    });
  });

  // Sample standings: deterministic shuffle of each group by hash
  const standings: Record<string, string[]> = {};
  GROUP_LETTERS.forEach((letter) => {
    standings[letter] = GROUPS[letter].slice().sort((a, b) => hash('st:' + a) - hash('st:' + b));
  });
  const W = GROUP_LETTERS.map((l) => ({ team: standings[l][0], label: 'Winner Grp ' + l }));
  const R = GROUP_LETTERS.map((l) => ({ team: standings[l][1], label: 'Runner-up Grp ' + l }));
  const T = GROUP_LETTERS.slice(0, 8).map((l) => ({ team: standings[l][2], label: '3rd place Grp ' + l }));

  // Round of 32 pairings (sample bracket) — Jun 28 → Jul 1, 4/day
  const r32Pairs: [{ team: string; label: string }, { team: string; label: string }][] = [];
  for (let g = 0; g < 8; g++) r32Pairs.push([W[g], T[(g + 3) % 8]]);
  for (let g = 8; g < 12; g++) r32Pairs.push([W[g], R[g - 8]]);
  for (let g = 4; g < 8; g++) r32Pairs.push([R[g], R[g + 4]]);

  const groupDone = simDay > 16; // all group matches finish dayIdx 16

  function resolveSide(feed: Feed): { code: string | null; label: string } {
    if (feed.match === undefined) {
      return { code: groupDone ? feed.team : null, label: feed.label };
    }
    const fm = feed.match;
    if (fm && fm.played) {
      const winner = hash(fm.id + ':w') % 2 === 0 ? fm.home : fm.away;
      return { code: winner, label: 'Winner Match ' + fm.num };
    }
    return { code: null, label: feed.label };
  }

  function pushKO(stage: Stage, dayIdx: number, feedHome: Feed, feedAway: Feed): Match {
    const h = resolveSide(feedHome), a = resolveSide(feedAway);
    return push({
      stage, dayIdx,
      home: h.code, away: a.code,
      homeLabel: h.label, awayLabel: a.label,
    });
  }

  const r32 = r32Pairs.map((pair, i) => pushKO('r32', 18 + Math.floor(i / 4),
    { team: pair[0].team, label: pair[0].label },
    { team: pair[1].team, label: pair[1].label }));
  const r16: Match[] = [];
  for (let i = 0; i < 8; i++) {
    r16.push(pushKO('r16', 24 + Math.floor(i / 2),
      { match: r32[i * 2], label: 'Winner Match ' + r32[i * 2].num },
      { match: r32[i * 2 + 1], label: 'Winner Match ' + r32[i * 2 + 1].num }));
  }
  const qf: Match[] = [];
  for (let i = 0; i < 4; i++) {
    qf.push(pushKO('qf', 29 + Math.floor(i / 2),
      { match: r16[i * 2], label: 'Winner Match ' + r16[i * 2].num },
      { match: r16[i * 2 + 1], label: 'Winner Match ' + r16[i * 2 + 1].num }));
  }
  const sf: Match[] = [];
  for (let i = 0; i < 2; i++) {
    sf.push(pushKO('sf', 34 + i,
      { match: qf[i * 2], label: 'Winner Match ' + qf[i * 2].num },
      { match: qf[i * 2 + 1], label: 'Winner Match ' + qf[i * 2 + 1].num }));
  }

  // Third place: losers of SFs — labels only unless SFs played
  function loserFeed(fm: Match): { team: string | null; label: string } {
    if (fm.played) {
      const winner = hash(fm.id + ':w') % 2 === 0 ? fm.home : fm.away;
      return { team: fm.home === winner ? fm.away : fm.home, label: 'Loser Match ' + fm.num };
    }
    return { team: null, label: 'Loser Match ' + fm.num };
  }
  const lf1 = loserFeed(sf[0]), lf2 = loserFeed(sf[1]);
  push({
    stage: 'third', dayIdx: 38,
    home: lf1.team && groupDone ? lf1.team : null, away: lf2.team && groupDone ? lf2.team : null,
    homeLabel: lf1.label, awayLabel: lf2.label,
  });

  pushKO('final', 39,
    { match: sf[0], label: 'Winner Match ' + sf[0].num },
    { match: sf[1], label: 'Winner Match ' + sf[1].num });

  return matches;
}

/** Computes "today" as a dayIdx relative to the tournament calendar (DAY0 = June 10, 2026 UTC). */
export function currentSimDay(): number {
  const todayUTC = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  return Math.round((todayUTC - DAY0) / 86400000);
}
