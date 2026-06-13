import type { LangCode, Match, Variant } from '../types';
import { fmtDay, fmtDayShort } from '../data/schedule';
import { MatchCard } from './MatchCard';

interface DaySectionProps {
  date: string;
  matches: Match[];
  onOpen: (match: Match, lang: LangCode, variant: Variant) => void;
  onInternational: (match: Match) => void;
}

export function DaySection({ date, matches, onOpen, onInternational }: DaySectionProps) {
  return (
    <section className="day-section" data-screen-label={'Matchday ' + fmtDayShort(date)}>
      <div className="day-head">
        <h2 className="day-title display">{fmtDay(date)}</h2>
        <span className="day-count mono">{matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}</span>
      </div>
      <div className="grid">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onOpen={onOpen} onInternational={onInternational} />
        ))}
      </div>
    </section>
  );
}
