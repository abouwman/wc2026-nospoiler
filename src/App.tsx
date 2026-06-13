import { useEffect, useMemo, useState } from 'react';
import type { LangCode, Match, Mode, Variant } from './types';
import { TEAMS } from './data/teams';
import { MATCHES, isUpcoming, hasAnyVideo } from './data/schedule';

// Show upcoming matches at most this far ahead.
const UPCOMING_WINDOW_MS = 8 * 60 * 60 * 1000;
import { DaySection } from './components/DaySection';
import { PlayerModal } from './components/PlayerModal';

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
  const [active, setActive] = useState<Active | null>(null);

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
      // Upcoming: only within the window. Played: only once a highlight exists.
      if (isUpcoming(m, now)) return new Date(m.kickoff!).getTime() - now <= UPCOMING_WINDOW_MS;
      return hasAnyVideo(m);
    });
  }, [groupFilter, teamFilter]);

  const days = useMemo(() => {
    const byDay = new Map<string, Match[]>();
    filtered.forEach((m) => {
      if (!byDay.has(m.date)) byDay.set(m.date, []);
      byDay.get(m.date)!.push(m);
    });
    // Most recent matchday first.
    const keys = [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1));
    return keys.map((k) => ({ date: k, matches: byDay.get(k)! }));
  }, [filtered]);

  return (
    <div className={'app mode-' + mode}>
      <header className="header" data-screen-label="Header">
        <div className="header-inner">
          <div className="wordmark">
            <span className="mark display">Hold<span className="accent">The</span>Score</span>
            <span className="sub mono">holdthescore.com · World Cup 2026 · Spoiler-free highlights</span>
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
          <DaySection key={d.date} date={d.date} matches={d.matches}
            onOpen={(m, l, v) => setActive({ match: m, lang: l, variant: v })} />
        ))}

        <div className="footer-note">
          <strong>About this data.</strong> Real FIFA World Cup 2026 highlights. Matches kicking off within the next 8
          hours are shown as <em>Upcoming</em> (no highlights yet); times are in your local time zone.
          <strong>English</strong> offers a short and an extended cut from FIFA / FOX on YouTube,
          available in the <strong>US only</strong>. <strong>Dutch</strong> plays NOS Sport's summary, available in the
          <strong>Netherlands only</strong>. Everything runs in the spoiler-shield player: title, duration/timestamps
          and end screens hidden. An <strong>N/A</strong> button means no source yet (Spanish has no non-YouTube source).
          No scores anywhere.
        </div>
      </main>

      {active ? (
        <PlayerModal match={active.match} initialLang={active.lang} initialVariant={active.variant}
          onClose={() => setActive(null)} />
      ) : null}
    </div>
  );
}
