import type { LangCode, Match, Variant } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDayShort } from '../data/schedule';
import { TeamPanel } from './TeamPanel';

interface MatchCardProps {
  match: Match;
  defaultLang: LangCode;
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
}

const VARIANTS: Variant[] = ['short', 'extended'];

export function MatchCard({ match, defaultLang, onOpen }: MatchCardProps) {
  const stageLabel = match.group ? 'Group ' + match.group : STAGE_LABELS[match.stage];
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
            const clips = match.videos[l];
            const cuts = clips ? VARIANTS.filter((v) => clips[v]) : [];

            if (cuts.length === 0) {
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

            return cuts.map((v) => {
              const src = clips![v]!;
              const flag = src.geo === 'US' ? '🇺🇸' : src.geo === 'NL' ? '🇳🇱' : '';
              const main = l === 'en' ? 'EN · ' + (v === 'extended' ? 'Ext' : 'Short') : LANGS[l].label;
              const geoText = src.geo ? src.geo + ' only' : LANGS[l].short;
              const primary = l === defaultLang && v === 'short' ? ' primary' : '';
              const where = src.geo === 'US' ? 'the United States' : src.geo === 'NL' ? 'the Netherlands' : '';
              const title = 'Watch ' + LANGS[l].name + ' ' + (v === 'extended' ? 'extended ' : '') +
                'highlights — ' + LANGS[l].source + (where ? ' · only available in ' + where : '');
              return (
                <button
                  key={l + ':' + v}
                  className={'lang-btn' + primary}
                  title={title}
                  onClick={() => onOpen(match, l, v)}
                >
                  <span>▶ {main}</span>
                  <small>{flag} {geoText}</small>
                </button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
