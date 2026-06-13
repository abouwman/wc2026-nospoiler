import type { LangCode, Match, Variant } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDayShort } from '../data/schedule';
import { TeamPanel } from './TeamPanel';

interface MatchCardProps {
  match: Match;
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
}

const VARIANTS: Variant[] = ['short', 'extended'];

function geoLabel(geo?: 'US' | 'NL'): string {
  return geo === 'US' ? '🇺🇸 US only' : geo === 'NL' ? '🇳🇱 NL only' : '🌍 Worldwide';
}

export function MatchCard({ match, onOpen }: MatchCardProps) {
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
                  <span className="lang-main">{LANGS[l].name}<span className="variant">no source</span></span>
                  <span className="lang-geo">N/A</span>
                </button>
              );
            }

            return cuts.map((v) => {
              const src = clips![v]!;
              const variant = l === 'en' ? (v === 'extended' ? 'Extended highlights' : 'Short highlights') : 'Samenvatting';
              const where = src.geo === 'US' ? 'the United States' : src.geo === 'NL' ? 'the Netherlands' : 'everywhere';
              const title = 'Watch ' + LANGS[l].name + ' ' + (v === 'extended' ? 'extended ' : '') +
                'highlights — ' + LANGS[l].source + ' · available in ' + where;
              return (
                <button
                  key={l + ':' + v}
                  className="lang-btn"
                  title={title}
                  onClick={() => onOpen(match, l, v)}
                >
                  <span className="lang-main">▶ {LANGS[l].name}<span className="variant">{variant}</span></span>
                  <span className="lang-geo">{geoLabel(src.geo)}</span>
                </button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
