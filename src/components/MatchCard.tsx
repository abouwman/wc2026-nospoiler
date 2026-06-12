import type { LangCode, Match } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS } from '../data/languages';
import { STAGE_LABELS, fmtDayShort } from '../data/schedule';
import { TeamPanel } from './TeamPanel';

interface MatchCardProps {
  match: Match;
  defaultLang: LangCode;
  onOpen: (match: Match, lang: LangCode) => void;
}

export function MatchCard({ match, defaultLang, onOpen }: MatchCardProps) {
  const playable = match.played && !!match.home && !!match.away;
  const stageLabel = match.stage === 'group' ? 'Group ' + match.group : STAGE_LABELS[match.stage];
  const homeT = match.home ? TEAMS[match.home] : null;
  const awayT = match.away ? TEAMS[match.away] : null;

  return (
    <div className={'card' + (playable ? ' playable' : '') + (match.status !== 'played' ? ' upcoming' : '')}>
      <div className="card-top">
        <span className="stage-chip mono">{stageLabel}</span>
        {match.status === 'today' ? <span className="live-chip">Today</span> : null}
        <span className="card-date mono">{fmtDayShort(match.dayIdx)} · {match.time}</span>
      </div>
      <div className="teams-row">
        <TeamPanel code={match.home} label={match.homeLabel} />
        <span className="vs mono">VS</span>
        <TeamPanel code={match.away} label={match.awayLabel} />
      </div>
      <div className="team-names">
        {homeT && awayT ? homeT.name + '  —  ' + awayT.name : match.venue}
      </div>
      <div className="card-foot">
        {playable ? (
          <div className="lang-row">
            {match.langs.map((l) => (
              <button
                key={l}
                className={'lang-btn' + (l === defaultLang ? ' primary' : '')}
                title={'Watch with ' + LANGS[l].name + ' commentary — ' + LANGS[l].source}
                onClick={() => onOpen(match, l)}
              >
                <span>▶ {LANGS[l].label}</span>
                <small>{LANGS[l].short}</small>
              </button>
            ))}
          </div>
        ) : (
          <>
            <span className="lang-dots">
              {match.langs.map((l) => <span key={l} className="lang-dot">{LANGS[l].label}</span>)}
            </span>
            <span className="lock-note">
              {match.status === 'today' ? 'Back after full-time' : 'Kicks off ' + fmtDayShort(match.dayIdx)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
