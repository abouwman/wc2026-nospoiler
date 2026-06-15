import type { LangCode, Match, Variant } from '../types';
import { TEAMS } from '../data/teams';
import { LANGS, LANG_ORDER } from '../data/languages';
import { STAGE_LABELS, fmtDayShort, fmtKickoffLocal, isUpcoming, hasAnySource } from '../data/schedule';
import { TeamPanel } from './TeamPanel';

interface MatchCardProps {
  match: Match;
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
  onInternational: (match: Match) => void;
  onBBC: (match: Match) => void;
}

const VARIANTS: Variant[] = ['short', 'extended'];

function geoLabel(geo?: 'US' | 'NL'): string {
  return geo === 'US' ? '🇺🇸 US only' : geo === 'NL' ? '🇳🇱 NL only' : '🌍 Worldwide';
}

export function MatchCard({ match, onOpen, onInternational, onBBC }: MatchCardProps) {
  const stageLabel = match.group ? 'Group ' + match.group : STAGE_LABELS[match.stage];
  const homeT = TEAMS[match.home];
  const awayT = TEAMS[match.away];
  const upcoming = isUpcoming(match);
  const available = hasAnySource(match);
  const comingSoon = !upcoming && !available;
  const when = match.kickoff ? fmtKickoffLocal(match.kickoff) : fmtDayShort(match.date);

  return (
    <div className={'card' + (upcoming ? ' upcoming' : available ? ' playable' : '')}>
      <div className="card-top">
        <span className="stage-chip mono">{stageLabel}</span>
        {upcoming ? <span className="soon-chip">Upcoming</span> : null}
        {comingSoon ? <span className="live-chip">Coming soon</span> : null}
        <span className="card-date mono">{when}</span>
      </div>
      <div className="teams-row">
        <TeamPanel code={match.home} />
        <span className="vs mono">VS</span>
        <TeamPanel code={match.away} />
      </div>
      <div className="team-names">{homeT.name + '  —  ' + awayT.name}</div>
      <div className="card-foot">
        {upcoming ? (
          <div className="upcoming-note">
            <span className="kick-time">⏱ {when} <span className="kick-tz">your time</span></span>
            <span className="kick-sub">Not played yet — highlights appear after full-time</span>
          </div>
        ) : comingSoon ? (
          <div className="upcoming-note">
            <span className="kick-time">⏳ Highlights coming soon</span>
            <span className="kick-sub">Kicked off {when} — check back shortly</span>
          </div>
        ) : (
          <div className="lang-row">
            {LANG_ORDER.map((l) => {
              const clips = match.videos[l];
              const cuts = clips ? VARIANTS.filter((v) => clips[v]) : [];
              return cuts.map((v) => {
                const src = clips![v]!;
                const variant = l === 'en' ? (v === 'extended' ? 'Extended highlights' : 'Short highlights') : 'Samenvatting';
                const where = src.geo === 'US' ? 'the United States' : src.geo === 'NL' ? 'the Netherlands' : 'everywhere';
                const title = 'Watch ' + LANGS[l].name + ' ' + (v === 'extended' ? 'extended ' : '') +
                  'highlights — ' + LANGS[l].source + ' · available in ' + where;
                return (
                  <button key={l + ':' + v} className="lang-btn" title={title} onClick={() => onOpen(match, l, v)}>
                    <span className="lang-geo">{geoLabel(src.geo)}</span>
                    <span className="lang-main">▶ {LANGS[l].name}<span className="variant">{variant}</span></span>
                  </button>
                );
              });
            })}
            {match.fifa ? (
              <button className="lang-btn intl" onClick={() => onInternational(match)}
                title="Watch this match on fifa.com (international) — opens a heads-up first">
                <span className="lang-geo">🌍 Worldwide</span>
                <span className="lang-main">▶ International<span className="variant">fifa.com ↗</span></span>
              </button>
            ) : null}
            {match.bbc ? (
              <button className="lang-btn bbc" onClick={() => onBBC(match)}
                title="Watch this match on BBC iPlayer (UK only) — opens a heads-up first">
                <span className="lang-geo">🇬🇧 UK only</span>
                <span className="lang-main">▶ BBC iPlayer<span className="variant">bbc.co.uk ↗</span></span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
