// World Cup No Spoiler — app shell
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "skin": "pitch",
  "simDay": 18,
  "density": "comfortable"
}/*EDITMODE-END*/;

const SKIN_NAMES = { pitch: 'Pitch', broadcast: 'Broadcast', poster: 'Poster' };
const STAGE_FILTERS = [
  ['all', 'All stages'], ['group', 'Group stage'], ['r32', 'Round of 32'], ['r16', 'Round of 16'],
  ['qf', 'Quarter-finals'], ['sf', 'Semi-finals'], ['third', 'Third place'], ['final', 'Final'],
];

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
  catch (e) { return fallback; }
}

function App() {
  const { useState, useMemo, useEffect } = React;
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [mode, setMode] = useState(() => loadLS('wcns-mode', 'light'));
  const [defaultLang, setDefaultLang] = useState(() => loadLS('wcns-lang', 'en'));
  const [tab, setTab] = useState('highlights');
  const [stageFilter, setStageFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => { try { localStorage.setItem('wcns-mode', JSON.stringify(mode)); } catch (e) {} }, [mode]);
  useEffect(() => { try { localStorage.setItem('wcns-lang', JSON.stringify(defaultLang)); } catch (e) {} }, [defaultLang]);

  const simDay = Math.round(t.simDay);
  const matches = useMemo(() => WC.build(simDay), [simDay]);

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
    const byDay = new Map();
    filtered.forEach((m) => {
      if (!byDay.has(m.dayIdx)) byDay.set(m.dayIdx, []);
      byDay.get(m.dayIdx).push(m);
    });
    const keys = [...byDay.keys()].sort((a, b) => tab === 'highlights' ? b - a : a - b);
    return keys.map((k) => ({ dayIdx: k, matches: byDay.get(k) }));
  }, [filtered, tab]);

  const teamOptions = useMemo(() => (
    Object.keys(WC.TEAMS).map((c) => ({ code: c, name: WC.TEAMS[c].name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), []);

  const showGroupChips = stageFilter === 'all' || stageFilter === 'group';

  return (
    <div className={'app skin-' + t.skin + ' mode-' + mode + ' density-' + t.density}>
      <header className="header" data-screen-label="Header">
        <div className="header-inner">
          <div className="wordmark">
            <span className="mark display">NO<span className="accent">SPOILER</span>CUP</span>
            <span className="sub mono">World Cup 2026 · Spoiler-free highlights</span>
          </div>
          <div className="seg-wrap">
            <span className="seg-label mono">Commentary</span>
            <div className="seg">
              {WC.LANG_ORDER.map((l) => (
                <button key={l} className={defaultLang === l ? 'on' : ''} title={WC.LANGS[l].name + ' — ' + WC.LANGS[l].source}
                  onClick={() => setDefaultLang(l)}>{WC.LANGS[l].label}</button>
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
            <select className="stage-select" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setGroupFilter(null); }}>
              {STAGE_FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <select className="team-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All teams</option>
              {teamOptions.map((o) => <option key={o.code} value={o.code}>{WC.TEAMS[o.code].flag} {o.name}</option>)}
            </select>
          </div>
        </div>

        {showGroupChips ? (
          <div className="chips">
            <button className={'chip' + (!groupFilter ? ' on' : '')} onClick={() => setGroupFilter(null)}>ALL</button>
            {WC.GROUP_LETTERS.map((l) => (
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
            defaultLang={defaultLang} onOpen={(m, l) => setActive({ match: m, lang: l })}></DaySection>
        ))}

        <div className="footer-note">
          <strong>Prototype notes.</strong> Groups, fixtures and standings are sample data — not the real 2026 draw.
          Videos are stand-in embeds (Blender open movies); in production each language button maps to a real highlight
          source (ESPN / Telemundo on YouTube, NOS for Dutch). The player hides the video title, shows no duration or
          timestamps (extra time leaks), and blocks YouTube end screens. No scores anywhere.
        </div>
      </main>

      {active ? (
        <PlayerModal match={active.match} initialLang={active.lang} onClose={() => setActive(null)}></PlayerModal>
      ) : null}

      <TweaksPanel>
        <TweakSection label="Look"></TweakSection>
        <TweakRadio label="Skin" value={t.skin} options={['pitch', 'broadcast', 'poster']}
          onChange={(v) => setTweak('skin', v)}></TweakRadio>
        <TweakRadio label="Density" value={t.density} options={['comfortable', 'compact']}
          onChange={(v) => setTweak('density', v)}></TweakRadio>
        <TweakSection label="Time travel"></TweakSection>
        <TweakSlider label={'Today = ' + WC.fmtDayShort(Math.round(t.simDay))} value={t.simDay} min={1} max={40} step={1}
          onChange={(v) => setTweak('simDay', v)}></TweakSlider>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App></App>);
