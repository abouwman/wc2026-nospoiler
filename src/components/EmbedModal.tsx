import { useEffect, useRef, useState } from 'react';
import type { Match } from '../types';
import { TEAMS } from '../data/teams';
import { STAGE_LABELS, fmtDay } from '../data/schedule';
import { toggleFullscreen } from '../data/fullscreen';

interface EmbedModalProps {
  match: Match;
  onClose: () => void;
}

// Plays the international (extended) highlight inside our own modal — a
// third-party embed, behind a one-tap heads-up, with source credit. The full
// match itself is linked out (not embedded), so this only handles highlights.
export function EmbedModal({ match, onClose }: EmbedModalProps) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const url = match.tstv?.highlights;
  if (!url) return null;
  const home = TEAMS[match.home], away = TEAMS[match.away];
  const stageLabel = match.group ? 'Group ' + match.group : STAGE_LABELS[match.stage];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" data-screen-label="Highlights player" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title display">
              <span className="mini-flag">{home.flag}</span> {match.home}
              <span className="vs mono">VS</span>
              {match.away} <span className="mini-flag">{away.flag}</span>
            </div>
            <div className="modal-sub">{[stageLabel, fmtDay(match.date)].join(' · ')}</div>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="video-wrap">
          {playing ? (
            <>
              <iframe ref={frameRef} className="embed-frame" src={url} title="International highlights"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" />
              <button className="fs-btn" title="Fullscreen"
                onClick={() => toggleFullscreen(frameRef.current)}>⛶</button>
            </>
          ) : (
            <div className="embed-gate">
              <div className="embed-gate-inner">
                <div className="leave-title display">Heads up — third-party player</div>
                <p className="leave-body">
                  This international highlight is hosted by a third-party site
                  (<strong>timesoccertv.com</strong>). We can't fully spoiler-shield it and its own
                  player may show controls or ads — press play and avoid its menus.
                </p>
                <button className="btn primary" onClick={() => setPlaying(true)}>Watch ▶</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <span className="source-label mono">
            Source: <a href={match.tstv!.page} target="_blank" rel="noopener noreferrer">timesoccertv.com</a>
          </span>
          <span className="no-spoiler-note">International highlights via timesoccertv.com.</span>
        </div>
      </div>
    </div>
  );
}
