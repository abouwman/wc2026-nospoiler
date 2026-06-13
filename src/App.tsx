import { useEffect, useMemo, useState } from 'react';
import type { LangCode, Match, Mode, Variant } from './types';
import { TEAMS } from './data/teams';
import { LANGS, LANG_ORDER } from './data/languages';
import { MATCHES } from './data/schedule';
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
  const [defaultLang, setDefaultLang] = useState<LangCode>(() => loadLS('wcns-lang', 'en'));
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => { try { localStorage.setItem('wcns-mode', JSON.stringify(mode)); } catch { /* noop */ } }, [mode]);
  useEffect(() => { try { localStorage.setItem('wcns-lang', JSON.stringify(defaultLang)); } catch { /* noop */ } }, [defaultLang]);

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

  const filtered = useMemo(() => MATCHES.filter((m) => {
    if (groupFilter && m.group !== groupFilter) return false;
    if (teamFilter && m.home !== teamFilter && m.away !== teamFilter) return false;
    return true;
  }), [groupFilter, teamFilter]);

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
            <span className="mark display">NO<span className="accent">SPOILER</span>CUP</span>
            <span className="sub mono">World Cup 2026 · Spoiler-free highlights</span>
          </div>
          <div className="seg-wrap">
            <span className="seg-label mono">Commentary</span>
            <div className="seg">
              {LANG_ORDER.map((l) => (
                <button key={l} className={defaultLang === l ? 'on' : ''} title={LANGS[l].name + ' — ' + LANGS[l].source}
                  onClick={() => setDefaultLang(l)}>{LANGS[l].label}</button>
              ))}
            </div>
          </div>
          <div className="seg">
            <button className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>Light</button>
            <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>Dark</button>
          </div>
        </div>
      </header>

      <main className="shell" data-screen-label="Match browser">
        <div className="toolbar">
          <div className="tabs">
            <span className="tab on">Played highlights</span>
          </div>
          <div className="filters">
            <select className="team-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All teams</option>
              {teamOptions.map((o) => <option key={o.code} value={o.code}>{TEAMS[o.code].flag} {o.name}</option>)}
            </select>
          </div>
        </div>

        {groups.length > 0 ? (
          <div className="chips">
            <button className={'chip' + (!groupFilter ? ' on' : '')} onClick={() => setGroupFilter(null)}>ALL</button>
            {groups.map((l) => (
              <button key={l} className={'chip' + (groupFilter === l ? ' on' : '')}
                onClick={() => setGroupFilter(groupFilter === l ? null : l)}>{l}</button>
            ))}
          </div>
        ) : null}

        {days.length === 0 ? (
          <div className="empty-state">No played matches match these filters yet.</div>
        ) : days.map((d) => (
          <DaySection key={d.date} date={d.date} matches={d.matches}
            defaultLang={defaultLang} onOpen={(m, l, v) => setActive({ match: m, lang: l, variant: v })} />
        ))}

        <div className="footer-note">
          <strong>About this data.</strong> Real FIFA World Cup 2026 highlights, played matches only — no upcoming or
          live fixtures. <strong>EN 🇺🇸 (US only)</strong> offers a <em>short</em> and an <em>extended</em> cut from
          FIFA / FOX on YouTube. <strong>NL 🇳🇱 (NL only)</strong> plays NOS Sport's Dutch summary, which only streams in
          the Netherlands. Everything runs in the spoiler-shield player: title, duration/timestamps and end screens
          hidden. A 🚫 button means no source yet — <strong>ES</strong> has no non-YouTube source. No scores anywhere.
        </div>
      </main>

      {active ? (
        <PlayerModal match={active.match} initialLang={active.lang} initialVariant={active.variant}
          onClose={() => setActive(null)} />
      ) : null}
    </div>
  );
}
