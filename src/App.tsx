import { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { LangCode, Match, Mode, Variant } from './types';
import { TEAMS } from './data/teams';
import { MATCHES, isUpcoming, hasAnySource, fifaUrl, bbcUrl, localDayKey, matchInstant } from './data/schedule';
import { DaySection } from './components/DaySection';
import type { Region } from './components/MatchCard';
import { PlayerModal } from './components/PlayerModal';
import { EmbedModal } from './components/EmbedModal';
import { LeaveModal, type LeaveTarget } from './components/LeaveModal';

const REGIONS: { code: Region; flag: string; label: string }[] = [
  { code: 'US', flag: '🇺🇸', label: 'US (Fox)' },
  { code: 'UK', flag: '🇬🇧', label: 'UK (BBC)' },
  { code: 'NL', flag: '🇳🇱', label: 'NL (NOS)' },
  { code: 'World', flag: '🌍', label: 'World (fifa.com)' },
];

// Show upcoming matches at most this far ahead.
const UPCOMING_WINDOW_MS = 12 * 60 * 60 * 1000;
// Keep showing a just-finished match (awaiting highlights) for this long.
const AWAIT_WINDOW_MS = 12 * 60 * 60 * 1000;

function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

interface Active {
  match: Match;
  lang: LangCode;
  variant: Variant;
}

export function App() {
  const [mode, setMode] = useState<Mode>(() => loadLS('wcns-mode', 'light'));
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [regions, setRegions] = useState<Set<Region>>(() => new Set(REGIONS.map((r) => r.code)));
  const toggleRegion = (code: Region) => setRegions((prev) => {
    const next = new Set(prev);
    next.has(code) ? next.delete(code) : next.add(code);
    return next;
  });
  const [active, setActive] = useState<Active | null>(null);
  const [embed, setEmbed] = useState<Match | null>(null);
  const [leave, setLeave] = useState<LeaveTarget | null>(null);

  useEffect(() => { try { localStorage.setItem('wcns-mode', JSON.stringify(mode)); } catch { /* noop */ } }, [mode]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    MATCHES.forEach((m) => { if (m.group) set.add(m.group); });
    return [...set].sort();
  }, []);

  const teamOptions = useMemo(() => {
    const codes = new Set<string>();
    MATCHES.forEach((m) => { codes.add(m.home); codes.add(m.away); });
    return [...codes]
      .map((c) => ({ code: c, name: TEAMS[c].name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return MATCHES.filter((m) => {
      if (groupFilter && m.group !== groupFilter) return false;
      if (teamFilter && m.home !== teamFilter && m.away !== teamFilter) return false;
      // Upcoming within the window; played once a highlight exists; otherwise a
      // recently-kicked-off match awaiting highlights ("coming soon").
      if (isUpcoming(m, now)) return new Date(m.kickoff!).getTime() - now <= UPCOMING_WINDOW_MS;
      if (hasAnySource(m)) return true;
      return !!m.kickoff && now - new Date(m.kickoff).getTime() <= AWAIT_WINDOW_MS;
    });
  }, [groupFilter, teamFilter]);

  const days = useMemo(() => {
    // Group by the viewer's local calendar day (a 00:00 local kickoff belongs to
    // that new day), most recent day first, and within each day show the latest
    // kickoff first (a 00:00 match is the "oldest", shown last).
    const byDay = new Map<string, Match[]>();
    filtered.forEach((m) => {
      const key = localDayKey(m);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(m);
    });
    const keys = [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1));
    return keys.map((k) => ({
      date: k,
      matches: byDay.get(k)!.sort((a, b) => matchInstant(b) - matchInstant(a)),
    }));
  }, [filtered]);

  return (
    <div className={'app mode-' + mode}>
      <header className="header" data-screen-label="Header">
        <div className="header-inner">
          <div className="wordmark">
            <span className="mark display">Hold<span className="accent">The</span>Score</span>
            <span className="sub mono">World Cup 2026 · Spoiler-free highlights</span>
          </div>
          <div className="region-filter" role="group" aria-label="Filter by region / language">
            {REGIONS.map((r) => (
              <button key={r.code} type="button" title={r.label} aria-pressed={regions.has(r.code)}
                className={'region-flag' + (regions.has(r.code) ? ' on' : '')}
                onClick={() => toggleRegion(r.code)}>
                <span aria-hidden="true">{r.flag}</span>
              </button>
            ))}
          </div>
          <div className="seg">
            <button className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>Light</button>
            <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>Dark</button>
          </div>
        </div>
      </header>

      <main className="shell" data-screen-label="Match browser">
        <div className="toolbar">
          {groups.length > 0 ? (
            <div className="chips">
              <span className="chips-label">Filter by group</span>
              <button className={'chip' + (!groupFilter ? ' on' : '')} onClick={() => setGroupFilter(null)}>All</button>
              {groups.map((l) => (
                <button key={l} className={'chip' + (groupFilter === l ? ' on' : '')}
                  onClick={() => setGroupFilter(groupFilter === l ? null : l)}>Group {l}</button>
              ))}
            </div>
          ) : null}
          <div className="filters">
            <select className="team-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All teams</option>
              {teamOptions.map((o) => <option key={o.code} value={o.code}>{TEAMS[o.code].flag} {o.name}</option>)}
            </select>
          </div>
        </div>

        {days.length === 0 ? (
          <div className="empty-state">No played matches match these filters yet.</div>
        ) : days.map((d) => (
          <DaySection key={d.date} date={d.date} matches={d.matches} regions={regions}
            onOpen={(m, l, v) => setActive({ match: m, lang: l, variant: v })}
            onInternational={(m) => setLeave({ url: fifaUrl(m), site: 'fifa.com' })}
            onBBC={(m) => setLeave({ url: bbcUrl(m), site: 'BBC iPlayer', geo: 'UK' })}
            onEmbed={(m) => setEmbed(m)}
            onFullMatch={(m) => m.tstv && setLeave({ url: m.tstv.page, site: 'timesoccertv.com', what: 'full match', official: false })} />
        ))}

        <div className="footer-note">
          <strong>About this data.</strong> Real FIFA World Cup 2026 highlights. Matches kicking off within the next 12
          hours show as <em>Upcoming</em>, just-finished ones as <em>Highlights coming soon</em>; all times are in your
          local time zone. <strong>English</strong> offers a short and an extended cut from FIFA / FOX on YouTube
          (<strong>US only</strong>); <strong>Dutch</strong> plays NOS Sport's summary (<strong>Netherlands only</strong>).
          Both run in the spoiler-shield player: title, duration/timestamps and end screens hidden. The
          <strong>International</strong> button opens the official fifa.com highlight, and <strong>BBC iPlayer</strong>
          (<strong>UK only</strong>) the BBC cut — both after a spoiler heads-up. No scores anywhere.
        </div>
      </main>

      {active ? (
        <PlayerModal match={active.match} initialLang={active.lang} initialVariant={active.variant}
          onClose={() => setActive(null)} />
      ) : null}

      {embed ? <EmbedModal match={embed} onClose={() => setEmbed(null)} /> : null}

      {leave ? <LeaveModal target={leave} onClose={() => setLeave(null)} /> : null}

      <Analytics />
    </div>
  );
}
