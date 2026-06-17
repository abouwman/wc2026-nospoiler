import { useEffect, useRef, useState } from 'react';
import { loadYT, type YTPlayer } from '../data/youtube';
import { toggleFullscreen } from '../data/fullscreen';

interface YouTubeHighlightProps {
  videoId: string;
  onClose: () => void;
}

// Spoiler-free YouTube player (NOS Sport summaries).
// Custom controls on top of the YouTube IFrame API:
//  - native controls off → no video title, no duration/timestamps, no end screen
//  - click-capture layer prevents tapping through to YouTube UI
//  - progress bar is percentage-only (duration leaks extra time / penalties)
export function YouTubeHighlight({ videoId, onClose }: YouTubeHighlightProps) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  // Progress bar is hidden by default; toggle remembers the choice.
  const [showProgress, setShowProgress] = useState(() => {
    try { return localStorage.getItem('hts-progress') === '1'; } catch { return false; }
  });
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  const toggleProgress = () => setShowProgress((v) => {
    const next = !v;
    try { localStorage.setItem('hts-progress', next ? '1' : '0'); } catch { /* noop */ }
    return next;
  });

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
          // Unofficial hint to request HD; YouTube ultimately picks adaptively
          // based on player size + bandwidth, so we also nudge it on ready.
          vq: 'hd1080',
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            const p = playerRef.current;
            try { p?.setPlaybackQualityRange?.('hd1080', 'highres'); } catch { /* noop */ }
            try { p?.setPlaybackQuality?.('hd1080'); } catch { /* noop */ }
            setReady(true);
          },
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

  return (
    <>
      <div className="video-wrap" ref={wrapRef}>
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
        <button className={'ctrl-btn' + (showProgress ? ' on' : '')} onClick={toggleProgress}
          title={showProgress ? 'Hide progress bar' : 'Show progress bar'}>👁</button>
        {showProgress ? (
          <div className="progress" onClick={seekFrac} title="Seek (no timestamps — they spoil extra time)">
            <div className="progress-track"><div className="progress-fill" style={{ width: (progress * 100) + '%' }}></div></div>
          </div>
        ) : (
          <div className="progress-spacer" />
        )}
        <button className="ctrl-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        <button className="ctrl-btn" onClick={() => toggleFullscreen(wrapRef.current)} title="Fullscreen">⛶</button>
      </div>
    </>
  );
}
