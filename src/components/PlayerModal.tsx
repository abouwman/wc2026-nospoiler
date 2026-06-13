import { useEffect, useState } from 'react';
import type { LangCode, Match } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDay } from '../data/schedule';
import { YouTubeHighlight } from './YouTubeHighlight';
import { FifaHighlight } from './FifaHighlight';

interface PlayerModalProps {
  match: Match;
  initialLang: LangCode;
  onClose: () => void;
}

// Modal chrome (header, commentary switch, footer). The actual player depends
// on the selected language's source: NOS Sport → spoiler-shield YouTube player,
// FIFA → FIFA's own embed. Keyed by lang so it remounts on a source switch.
export function PlayerModal({ match, initialLang, onClose }: PlayerModalProps) {
  const availableLangs = LANG_ORDER.filter((l) => !!match.videos[l]);
  const startLang = match.videos[initialLang] ? initialLang : availableLangs[0];
  const [lang, setLang] = useState<LangCode>(startLang);
  const source = match.videos[lang]!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

        {source.kind === 'youtube'
          ? <YouTubeHighlight key={lang} videoId={source.id} onClose={onClose} />
          : <FifaHighlight key={lang} watchId={source.id} />}

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
