import { useEffect, useState } from 'react';
import type { Match } from '../types';
import { TEAMS } from '../data/teams';
import { STAGE_LABELS, fmtDay } from '../data/schedule';

export type EmbedKind = 'full' | 'highlights';

interface Seg { key: string; label: string; url: string; }

interface EmbedModalProps {
  match: Match;
  initialKind: EmbedKind;
  onClose: () => void;
}

// Build the playable segments from a match's timesoccertv data: the extended
// highlights plus each full-match half.
function segmentsOf(match: Match): Seg[] {
  const t = match.tstv;
  const out: Seg[] = [];
  if (t?.highlights) out.push({ key: 'hl', label: 'Highlights', url: t.highlights });
  const full = t?.full || [];
  full.forEach((url, i) => out.push({
    key: 'full' + i,
    label: full.length > 1 ? (['1st half', '2nd half'][i] || 'Part ' + (i + 1)) : 'Full match',
    url,
  }));
  return out;
}

// Plays a timesoccertv full-match replay / international highlight inside our own
// modal (third-party embed), behind a one-tap heads-up, with source credit.
export function EmbedModal({ match, initialKind, onClose }: EmbedModalProps) {
  const segs = segmentsOf(match);
  const startKey = (initialKind === 'full'
    ? segs.find((s) => s.key.startsWith('full'))
    : segs.find((s) => s.key === 'hl'))?.key || segs[0]?.key;
  const [activeKey, setActiveKey] = useState(startKey);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const seg = segs.find((s) => s.key === activeKey) || segs[0];
  if (!seg || !match.tstv) return null;
  const home = TEAMS[match.home], away = TEAMS[match.away];
  const stageLabel = match.group ? 'Group ' + match.group : STAGE_LABELS[match.stage];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" data-screen-label="Replay player" onClick={(e) => e.stopPropagation()}>
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
            <iframe className="embed-frame" src={seg.url} title="Match replay"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" />
          ) : (
            <div className="embed-gate">
              <div className="embed-gate-inner">
                <div className="leave-title display">Heads up — third-party player</div>
                <p className="leave-body">
                  This {initialKind === 'full' ? 'full match' : 'international highlight'} is hosted by
                  a third-party site (<strong>timesoccertv.com</strong>). We can't fully spoiler-shield
                  it and its own player may show controls or ads — press play and avoid its menus.
                </p>
                <button className="btn primary" onClick={() => setPlaying(true)}>Watch ▶</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {segs.length > 1 ? (
            <div className="seg-wrap">
              <span className="seg-label mono">Watch</span>
              <div className="seg">
                {segs.map((s) => (
                  <button key={s.key} className={s.key === activeKey ? 'on' : ''}
                    onClick={() => { setActiveKey(s.key); setPlaying(true); }}>{s.label}</button>
                ))}
              </div>
            </div>
          ) : null}
          <span className="source-label mono">
            Source: <a href={match.tstv.page} target="_blank" rel="noopener noreferrer">timesoccertv.com</a>
          </span>
          <span className="no-spoiler-note">Full replays &amp; international highlights via timesoccertv.com.</span>
        </div>
      </div>
    </div>
  );
}
