import type { LangCode, Match } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDayShort } from '../data/schedule';
import { canEmbedFifa, fifaWatchUrl } from '../data/sources';
import { TeamPanel } from './TeamPanel';

interface MatchCardProps {
  match: Match;
  defaultLang: LangCode;
  onOpen: (match: Match, lang: LangCode) => void;
}

export function MatchCard({ match, defaultLang, onOpen }: MatchCardProps) {
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : STAGE_LABELS[match.stage];
  const homeT = TEAMS[match.home];
  const awayT = TEAMS[match.away];

  return (
    <div className="card playable">
      <div className="card-top">
        <span className="stage-chip mono">{stageLabel}</span>
        <span className="card-date mono">{fmtDayShort(match.date)}</span>
      </div>
      <div className="teams-row">
        <TeamPanel code={match.home} />
        <span className="vs mono">VS</span>
        <TeamPanel code={match.away} />
      </div>
      <div className="team-names">{homeT.name + '  —  ' + awayT.name}</div>
      <div className="card-foot">
        <div className="lang-row">
          {LANG_ORDER.map((l) => {
            const src = match.videos[l];
            const primary = l === defaultLang ? ' primary' : '';

            if (!src) {
              return (
                <button
                  key={l}
                  className="lang-btn unavailable"
                  disabled
                  title={'No ' + LANGS[l].name + ' highlight available (' + LANGS[l].source + ')'}
                >
                  <span>🚫 {LANGS[l].label}</span>
                  <small>N/A</small>
                </button>
              );
            }

            // FIFA's player needs a partner credential to embed; without one we
            // open the official fifa.com page in a new tab instead.
            if (src.kind === 'fifa' && !canEmbedFifa) {
              return (
                <a
                  key={l}
                  className={'lang-btn' + primary}
                  href={fifaWatchUrl(src.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={'Open ' + LANGS[l].name + ' highlight on fifa.com'}
                >
                  <span>↗ {LANGS[l].label}</span>
                  <small>{LANGS[l].short}</small>
                </a>
              );
            }

            return (
              <button
                key={l}
                className={'lang-btn' + primary}
                title={'Watch with ' + LANGS[l].name + ' commentary — ' + LANGS[l].source}
                onClick={() => onOpen(match, l)}
              >
                <span>▶ {LANGS[l].label}</span>
                <small>{LANGS[l].short}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
