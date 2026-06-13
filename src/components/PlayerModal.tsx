import { useEffect, useState } from 'react';
import type { LangCode, Match, Variant } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, tracksOf } from '../data/languages';
import { STAGE_LABELS, fmtDay } from '../data/schedule';
import { YouTubeHighlight } from './YouTubeHighlight';

interface PlayerModalProps {
  match: Match;
  initialLang: LangCode;
  initialVariant: Variant;
  onClose: () => void;
}

function trackTitle(lang: LangCode, variant: Variant): string {
  if (lang === 'en') return 'EN ' + (variant === 'extended' ? 'Extended' : 'Short');
  return LANGS[lang].label;
}

// Modal chrome (header, track switch, footer). Every clip is a YouTube video, so
// it always plays in the spoiler-shield player. The track selector lets you flip
// between the available cuts/languages mid-watch.
export function PlayerModal({ match, initialLang, initialVariant, onClose }: PlayerModalProps) {
  const tracks = tracksOf(match);
  const initialKey = initialLang + ':' + initialVariant;
  const startKey = tracks.some((t) => t.key === initialKey) ? initialKey : tracks[0].key;
  const [activeKey, setActiveKey] = useState(startKey);
  const track = tracks.find((t) => t.key === activeKey)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const home = TEAMS[match.home], away = TEAMS[match.away];
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : STAGE_LABELS[match.stage];
  const geoNote = track.source.geo === 'US' ? ' · US only' : '';

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

        <YouTubeHighlight key={activeKey} videoId={track.source.id} onClose={onClose} />

        <div className="modal-foot">
          <div className="seg-wrap">
            <span className="seg-label mono">Highlights</span>
            <div className="seg">
              {tracks.map((t) => (
                <button key={t.key} className={t.key === activeKey ? 'on' : ''}
                  onClick={() => setActiveKey(t.key)}>{trackTitle(t.lang, t.variant)}</button>
              ))}
            </div>
          </div>
          <span className="source-label mono">Source: {LANGS[track.lang].source}{geoNote}</span>
          <span className="no-spoiler-note">No score shown anywhere. Enjoy the match.</span>
        </div>
      </div>
    </div>
  );
}
