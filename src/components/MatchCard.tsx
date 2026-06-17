import type { LangCode, Match, Variant } from '../types';
import { TEAMS } from '../data/teams';
import { STAGE_LABELS, fmtDayShort, fmtKickoffLocal, isUpcoming, hasAnySource } from '../data/schedule';
import type { EmbedKind } from './EmbedModal';
import { TeamPanel } from './TeamPanel';

export type Region = 'US' | 'UK' | 'NL' | 'World';

interface MatchCardProps {
  match: Match;
  /** When set, only that region's sources are shown (World is always shown). */
  regionFilter: Region | null;
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
  onInternational: (match: Match) => void;
  onBBC: (match: Match) => void;
  onEmbed: (match: Match, kind: EmbedKind) => void;
}

const REGION_TAG: Record<Region, string> = {
  US: '🇺🇸 US only', UK: '🇬🇧 UK only', NL: '🇳🇱 NL only', World: '🌍 World',
};

interface Src {
  region: Region;
  label: string;
  variant?: string;
  external?: boolean;
  title: string;
  onClick: () => void;
}

// Build a match's sources in the fixed display order: US → UK → NL → World.
function sourcesOf(
  match: Match,
  onOpen: MatchCardProps['onOpen'],
  onInternational: MatchCardProps['onInternational'],
  onBBC: MatchCardProps['onBBC'],
  onEmbed: MatchCardProps['onEmbed'],
): Src[] {
  const out: Src[] = [];
  const en = match.videos.en;
  if (en) {
    (['short', 'extended'] as Variant[]).forEach((v) => {
      if (en[v]) out.push({
        region: 'US', label: 'Fox', variant: v === 'extended' ? 'Extended' : 'Short',
        title: 'Watch Fox ' + (v === 'extended' ? 'extended' : 'short') + ' highlights — US only',
        onClick: () => onOpen(match, 'en', v),
      });
    });
  }
  if (match.bbc) {
    out.push({
      region: 'UK', label: 'BBC iPlayer', external: true,
      title: 'Watch on BBC iPlayer (UK only) — opens a heads-up first',
      onClick: () => onBBC(match),
    });
  }
  const nl = match.videos.nl;
  if (nl) {
    (['short', 'extended'] as Variant[]).forEach((v) => {
      if (nl[v]) out.push({
        region: 'NL', label: 'NOS Sport',
        title: 'Watch the NOS Sport summary — Netherlands only',
        onClick: () => onOpen(match, 'nl', v),
      });
    });
  }
  if (match.fifa) {
    out.push({
      region: 'World', label: 'International', external: true,
      title: 'Watch on fifa.com (international) — opens a heads-up first',
      onClick: () => onInternational(match),
    });
  }
  if (match.tstv?.highlights) {
    out.push({
      region: 'World', label: 'Highlights', variant: 'Intl',
      title: 'Watch international highlights (via timesoccertv.com)',
      onClick: () => onEmbed(match, 'highlights'),
    });
  }
  if (match.tstv?.full && match.tstv.full.length > 0) {
    out.push({
      region: 'World', label: 'Full match',
      title: 'Watch the full match replay (via timesoccertv.com)',
      onClick: () => onEmbed(match, 'full'),
    });
  }
  return out;
}

export function MatchCard({ match, regionFilter, onOpen, onInternational, onBBC, onEmbed }: MatchCardProps) {
  const stageLabel = match.group ? 'Group ' + match.group : STAGE_LABELS[match.stage];
  const homeT = TEAMS[match.home];
  const awayT = TEAMS[match.away];
  const upcoming = isUpcoming(match);
  const available = hasAnySource(match);
  const comingSoon = !upcoming && !available;
  const when = match.kickoff ? fmtKickoffLocal(match.kickoff) : fmtDayShort(match.date);

  const all = sourcesOf(match, onOpen, onInternational, onBBC, onEmbed);
  // Apply the region filter. World (fifa.com) is always kept; selecting a
  // region with no source still shows World plus an "other regions" note.
  let shown = all;
  let regionEmpty = false;
  if (regionFilter === 'World') {
    shown = all.filter((s) => s.region === 'World');
  } else if (regionFilter) {
    const regional = all.filter((s) => s.region === regionFilter);
    regionEmpty = regional.length === 0;
    shown = [...regional, ...all.filter((s) => s.region === 'World')];
  }

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
            {regionEmpty ? <div className="region-note">Available in other regions</div> : null}
            {shown.map((s, i) => (
              <div key={s.region + ':' + i} className="src-item">
                <span className="src-geo">{REGION_TAG[s.region]}</span>
                <button className="lang-btn" title={s.title} onClick={s.onClick}>
                  <span className="lang-main">{s.label}{s.variant ? <span className="variant">{s.variant}</span> : null}</span>
                  {s.external ? <span className="ext-arrow">↗</span> : null}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
