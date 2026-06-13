import { useEffect, useMemo, useState } from 'react';
import type { LangCode, Match, Mode, StageFilter, Tab } from './types';
import { TEAMS, GROUP_LETTERS } from './data/teams';
import { LANGS, LANG_ORDER } from './data/languages';
import { build, currentSimDay } from './data/schedule';
import { DaySection } from './components/DaySection';
import { PlayerModal } from './components/PlayerModal';

const STAGE_FILTERS: [StageFilter, string][] = [
  ['all', 'All stages'], ['group', 'Group stage'], ['r32', 'Round of 32'], ['r16', 'Round of 16'],
  ['qf', 'Quarter-finals'], ['sf', 'Semi-finals'], ['third', 'Third place'], ['final', 'Final'],
];

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
}

export function App() {
  const [mode, setMode] = useState<Mode>(() => loadLS('wcns-mode', 'light'));
  const [defaultLang, setDefaultLang] = useState<LangCode>(() => loadLS('wcns-lang', 'en'));
  const [tab, setTab] = useState<Tab>('highlights');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => { try { localStorage.setItem('wcns-mode', JSON.stringify(mode)); } catch { /* noop */ } }, [mode]);
  useEffect(() => { try { localStorage.setItem('wcns-lang', JSON.stringify(defaultLang)); } catch { /* noop */ } }, [defaultLang]);

  const simDay = useMemo(() => currentSimDay(), []);
  const matches = useMemo(() => build(simDay), [simDay]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (tab === 'highlights' && m.status !== 'played') return false;
      if (tab === 'schedule' && m.status === 'played') return false;
      if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
      if (groupFilter && m.group !== groupFilter) return false;
      if (teamFilter && m.home !== teamFilter && m.away !== teamFilter) return false;
      return true;
    });
  }, [matches, tab, stageFilter, groupFilter, teamFilter]);

  const days = useMemo(() => {
    const byDay = new Map<number, Match[]>();
    filtered.forEach((m) => {
      if (!byDay.has(m.dayIdx)) byDay.set(m.dayIdx, []);
      byDay.get(m.dayIdx)!.push(m);
    });
    const keys = [...byDay.keys()].sort((a, b) => tab === 'highlights' ? b - a : a - b);
    return keys.map((k) => ({ dayIdx: k, matches: byDay.get(k)! }));
  }, [filtered, tab]);

  const teamOptions = useMemo(() => (
    Object.keys(TEAMS).map((c) => ({ code: c, name: TEAMS[c].name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), []);

  const showGroupChips = stageFilter === 'all' || stageFilter === 'group';

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
            <button className={'tab' + (tab === 'highlights' ? ' on' : '')} onClick={() => setTab('highlights')}>Highlights</button>
            <button className={'tab' + (tab === 'schedule' ? ' on' : '')} onClick={() => setTab('schedule')}>Schedule</button>
          </div>
          <div className="filters">
            <select className="stage-select" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value as StageFilter); setGroupFilter(null); }}>
              {STAGE_FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <select className="team-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All teams</option>
              {teamOptions.map((o) => <option key={o.code} value={o.code}>{TEAMS[o.code].flag} {o.name}</option>)}
            </select>
          </div>
        </div>

        {showGroupChips ? (
          <div className="chips">
            <button className={'chip' + (!groupFilter ? ' on' : '')} onClick={() => setGroupFilter(null)}>ALL</button>
            {GROUP_LETTERS.map((l) => (
              <button key={l} className={'chip' + (groupFilter === l ? ' on' : '')}
                onClick={() => setGroupFilter(groupFilter === l ? null : l)}>{l}</button>
            ))}
          </div>
        ) : null}

        {days.length === 0 ? (
          <div className="empty-state">
            {tab === 'highlights'
              ? 'No highlights match these filters yet. The tournament may not have reached this stage.'
              : 'Nothing upcoming under these filters.'}
          </div>
        ) : days.map((d) => (
          <DaySection key={d.dayIdx} dayIdx={d.dayIdx} matches={d.matches}
            defaultLang={defaultLang} onOpen={(m, l) => setActive({ match: m, lang: l })} />
        ))}

        <div className="footer-note">
          <strong>About this data.</strong> Groups, fixtures and standings are sample data — not the real 2026 draw.
          Each language button now maps to a real World Cup 2026 highlight: EN from FIFA, ES from Telemundo, and NL from
          NOS — all on YouTube. Because fixtures are sample data, clips are assigned to cards deterministically, so a
          card's flags may not match the footage. The player hides the video title, shows no duration or timestamps
          (extra time leaks), and blocks YouTube end screens. No scores anywhere.
        </div>
      </main>

      {active ? (
        <PlayerModal match={active.match} initialLang={active.lang} onClose={() => setActive(null)} />
      ) : null}
    </div>
  );
}
