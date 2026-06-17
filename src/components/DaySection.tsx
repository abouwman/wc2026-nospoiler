import type { LangCode, Match, Variant } from '../types';
import { fmtDay, fmtDayShort } from '../data/schedule';
import { MatchCard, type Region } from './MatchCard';
import type { EmbedKind } from './EmbedModal';

interface DaySectionProps {
  date: string;
  matches: Match[];
  regionFilter: Region | null;
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
  onInternational: (match: Match) => void;
  onBBC: (match: Match) => void;
  onEmbed: (match: Match, kind: EmbedKind) => void;
}

export function DaySection({ date, matches, regionFilter, onOpen, onInternational, onBBC, onEmbed }: DaySectionProps) {
  return (
    <section className="day-section" data-screen-label={'Matchday ' + fmtDayShort(date)}>
      <div className="day-head">
        <h2 className="day-title display">{fmtDay(date)}</h2>
        <span className="day-count mono">{matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}</span>
      </div>
      <div className="grid">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} regionFilter={regionFilter}
            onOpen={onOpen} onInternational={onInternational} onBBC={onBBC} onEmbed={onEmbed} />
        ))}
      </div>
    </section>
  );
}
