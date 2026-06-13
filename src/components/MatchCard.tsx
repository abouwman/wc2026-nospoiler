import type { LangCode, Match } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDayShort } from '../data/schedule';
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
            const available = !!match.videos[l];
            return (
              <button
                key={l}
                className={'lang-btn' + (available ? (l === defaultLang ? ' primary' : '') : ' unavailable')}
                disabled={!available}
                title={available
                  ? 'Watch with ' + LANGS[l].name + ' commentary — ' + LANGS[l].source
                  : 'No ' + LANGS[l].name + ' highlight available (' + LANGS[l].source + ')'}
                onClick={() => { if (available) onOpen(match, l); }}
              >
                <span>{available ? '▶' : '🚫'} {LANGS[l].label}</span>
                <small>{available ? LANGS[l].short : 'N/A'}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
