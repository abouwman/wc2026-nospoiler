import { useEffect, useRef, useState } from 'react';
import type { LangCode, Match } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDay } from '../data/schedule';
import { loadYT, type YTPlayer } from '../data/youtube';

interface PlayerModalProps {
  match: Match;
  initialLang: LangCode;
  onClose: () => void;
}

// Spoiler-free player modal.
// Custom controls on top of the YouTube IFrame API:
//  - native controls off → no video title, no duration/timestamps, no end screen
//  - click-capture layer prevents tapping through to YouTube UI
//  - progress bar is percentage-only (duration leaks extra time / penalties)
export function PlayerModal({ match, initialLang, onClose }: PlayerModalProps) {
  const availableLangs = LANG_ORDER.filter((l) => !!match.videos[l]);
  const startLang = match.videos[initialLang] ? initialLang : availableLangs[0];
  const [lang, setLang] = useState<LangCode>(startLang);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const videoId = match.videos[lang]!;

  // Create the player once
  useEffect(() => {
    let cancelled = false;
    loadYT(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3,
          disablekb: 1, fs: 0, playsinline: 1, origin: window.location.origin,
        },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (e) => {
            if (cancelled || !window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) { setPlaying(true); setEnded(false); }
            if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) { setPlaying(false); setEnded(true); }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current) { try { playerRef.current.destroy(); } catch { /* noop */ } }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language switch → different source video
  useEffect(() => {
    const p = playerRef.current;
    if (ready && p) { setEnded(false); p.loadVideoById(videoId); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Poll progress (shown as % only — never time)
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current;
      if (ready && p) {
        const d = p.getDuration();
        if (d > 0) setProgress(Math.min(1, p.getCurrentTime() / d));
      }
    }, 400);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const api = () => (ready && playerRef.current) || null;
  const togglePlay = () => { const p = api(); if (!p) return; playing ? p.pauseVideo() : p.playVideo(); };
  const skip = (s: number) => { const p = api(); if (!p) return; p.seekTo(Math.max(0, p.getCurrentTime() + s), true); };
  const toggleMute = () => { const p = api(); if (!p) return; muted ? p.unMute() : p.mute(); setMuted(!muted); };
  const seekFrac = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = api(); if (!p) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    p.seekTo(frac * p.getDuration(), true);
    setProgress(frac);
  };
  const replay = () => { const p = api(); if (!p) return; setEnded(false); p.seekTo(0, true); p.playVideo(); };

  const home = TEAMS[match.home], away = TEAMS[match.away];
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : STAGE_LABELS[match.stage];

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
            <div className="modal-sub">{stageLabel} · {fmtDay(match.date)} · {match.venue}</div>
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
              {availableLangs.map((l) => (
                <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{LANGS[l].label}</button>
              ))}
            </div>
          </div>
          <span className="source-label mono">Source: {LANGS[lang].source}</span>
          <span className="no-spoiler-note">No score shown anywhere. Enjoy the match.</span>
        </div>
      </div>
    </div>
  );
}
