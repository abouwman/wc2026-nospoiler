// World Cup No Spoiler — UI components
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Team color panel ----------
function teamPanelStyle(code) {
  const c = WC.TEAMS[code].colors;
  return { background: 'linear-gradient(135deg, ' + c[0] + ' 0%, ' + c[0] + ' 62%, ' + c[1] + ' 62.4%)' };
}

function TeamPanel({ code, label }) {
  const t = code ? WC.TEAMS[code] : null;
  if (!t) {
    return (
      <div className="team-panel tbd">
        <span className="panel-code display">TBD</span>
        <span className="panel-label mono">{label || 'To be decided'}</span>
      </div>
    );
  }
  return (
    <div className="team-panel" style={teamPanelStyle(code)}>
      <span className="panel-flag" aria-hidden="true">{t.flag}</span>
      <span className="panel-code display">{code}</span>
    </div>
  );
}

// ---------- Match card ----------
function MatchCard({ match, defaultLang, onOpen }) {
  const playable = match.played && match.home && match.away;
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : WC.STAGE_LABELS[match.stage];
  const homeT = match.home ? WC.TEAMS[match.home] : null;
  const awayT = match.away ? WC.TEAMS[match.away] : null;
  return (
    <div className={'card' + (playable ? ' playable' : '') + (match.status !== 'played' ? ' upcoming' : '')}>
      <div className="card-top">
        <span className="stage-chip mono">{stageLabel}</span>
        {match.status === 'today' ? <span className="live-chip">Today</span> : null}
        <span className="card-date mono">{WC.fmtDayShort(match.dayIdx)} · {match.time}</span>
      </div>
      <div className="teams-row">
        <TeamPanel code={match.home} label={match.homeLabel}></TeamPanel>
        <span className="vs mono">VS</span>
        <TeamPanel code={match.away} label={match.awayLabel}></TeamPanel>
      </div>
      <div className="team-names">
        {homeT && awayT ? homeT.name + '  —  ' + awayT.name : match.venue}
      </div>
      <div className="card-foot">
        {playable ? (
          <div className="lang-row">
            {match.langs.map((l) => (
              <button key={l}
                className={'lang-btn' + (l === defaultLang ? ' primary' : '')}
                title={'Watch with ' + WC.LANGS[l].name + ' commentary — ' + WC.LANGS[l].source}
                onClick={() => onOpen(match, l)}>
                <span>▶ {WC.LANGS[l].label}</span>
                <small>{WC.LANGS[l].short}</small>
              </button>
            ))}
          </div>
        ) : (
          <React.Fragment>
            <span className="lang-dots">
              {match.langs.map((l) => <span key={l} className="lang-dot">{WC.LANGS[l].label}</span>)}
            </span>
            <span className="lock-note">
              {match.status === 'today' ? 'Back after full-time' : 'Kicks off ' + WC.fmtDayShort(match.dayIdx)}
            </span>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ---------- Day section ----------
function DaySection({ dayIdx, matches, defaultLang, onOpen }) {
  return (
    <section className="day-section" data-screen-label={'Matchday ' + WC.fmtDayShort(dayIdx)}>
      <div className="day-head">
        <h2 className="day-title display">{WC.fmtDay(dayIdx)}</h2>
        <span className="day-count mono">{matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}</span>
      </div>
      <div className="grid">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} defaultLang={defaultLang} onOpen={onOpen}></MatchCard>
        ))}
      </div>
    </section>
  );
}

// ---------- Spoiler-free player modal ----------
// Custom controls on top of the YouTube IFrame API:
//  - native controls off → no video title, no duration/timestamps, no end screen
//  - click-capture layer prevents tapping through to YouTube UI
//  - progress bar is percentage-only (duration leaks extra time / penalties)
function PlayerModal({ match, initialLang, onClose }) {
  const startLang = match.langs.includes(initialLang) ? initialLang : match.langs[0];
  const [lang, setLang] = useState(startLang);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const videoId = WC.videoFor(match.id, lang);

  // Create the player once
  useEffect(() => {
    let cancelled = false;
    WC.loadYT(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3,
          disablekb: 1, fs: 0, playsinline: 1, origin: window.location.origin,
        },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT.PlayerState.PLAYING) { setPlaying(true); setEnded(false); }
            if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === YT.PlayerState.ENDED) { setPlaying(false); setEnded(true); }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) { try { playerRef.current.destroy(); } catch (e) {} }
      playerRef.current = null;
    };
  }, []);

  // Language switch → different source video
  useEffect(() => {
    const p = playerRef.current;
    if (ready && p && p.loadVideoById) { setEnded(false); p.loadVideoById(videoId); }
  }, [videoId]);

  // Poll progress (shown as % only — never time)
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (ready && p && p.getDuration && p.getCurrentTime) {
        const d = p.getDuration();
        if (d > 0) setProgress(Math.min(1, p.getCurrentTime() / d));
      }
    }, 400);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const api = () => (ready && playerRef.current) || null;
  const togglePlay = () => { const p = api(); if (!p) return; playing ? p.pauseVideo() : p.playVideo(); };
  const skip = (s) => { const p = api(); if (!p) return; p.seekTo(Math.max(0, p.getCurrentTime() + s), true); };
  const toggleMute = () => { const p = api(); if (!p) return; muted ? p.unMute() : p.mute(); setMuted(!muted); };
  const seekFrac = (e) => {
    const p = api(); if (!p) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    p.seekTo(frac * p.getDuration(), true);
    setProgress(frac);
  };
  const replay = () => { const p = api(); if (!p) return; setEnded(false); p.seekTo(0, true); p.playVideo(); };

  const home = WC.TEAMS[match.home], away = WC.TEAMS[match.away];
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : WC.STAGE_LABELS[match.stage];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" data-screen-label="Highlight player" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title display">
              <span className="mini-flag">{home.flag}</span> {match.home}
              <span className="vs mono">VS</span>
              {match.away} <span className="mini-flag">{away.flag}</span>
            </div>
            <div className="modal-sub">{stageLabel} · {WC.fmtDay(match.dayIdx)} · {match.venue}</div>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="video-wrap">
          <div className="yt-host" ref={hostRef}></div>
          <div className="click-layer" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}></div>
          <div className="mask-top mono">
            <span className="shield"></span>
            <span>Spoiler shield — title, duration &amp; related videos hidden</span>
          </div>
          {!ready ? (
            <div className="loading-overlay"><span className="mono" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>LOADING HIGHLIGHTS…</span></div>
          ) : null}
          {ended ? (
            <div className="ended-overlay">
              <div className="big display">Full-time on the highlights</div>
              <div className="overlay-actions">
                <button className="btn primary" onClick={replay}>Replay</button>
                <button className="btn" onClick={onClose}>Close</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="controls">
          <button className="ctrl-btn play" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
          <button className="ctrl-btn" onClick={() => skip(-10)} title="Back 10 seconds"><span className="skip-label">‹ 10s</span></button>
          <button className="ctrl-btn" onClick={() => skip(10)} title="Forward 10 seconds"><span className="skip-label">10s ›</span></button>
          <div className="progress" onClick={seekFrac} title="Seek (no timestamps — they spoil extra time)">
            <div className="progress-track"><div className="progress-fill" style={{ width: (progress * 100) + '%' }}></div></div>
          </div>
          <button className="ctrl-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        </div>

        <div className="modal-foot">
          <div className="seg-wrap">
            <span className="seg-label mono">Commentary</span>
            <div className="seg">
              {match.langs.map((l) => (
                <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{WC.LANGS[l].label}</button>
              ))}
            </div>
          </div>
          <span className="source-label mono">Source: {WC.LANGS[lang].source}</span>
          <span className="no-spoiler-note">No score shown anywhere. Enjoy the match.</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TeamPanel, MatchCard, DaySection, PlayerModal });
