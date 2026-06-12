import type { LangCode, Match } from '../types';
import { fmtDay, fmtDayShort } from '../data/schedule';
import { MatchCard } from './MatchCard';

interface DaySectionProps {
  dayIdx: number;
  matches: Match[];
  defaultLang: LangCode;
  onOpen: (match: Match, lang: LangCode) => void;
}

export function DaySection({ dayIdx, matches, defaultLang, onOpen }: DaySectionProps) {
  return (
    <section className="day-section" data-screen-label={'Matchday ' + fmtDayShort(dayIdx)}>
      <div className="day-head">
        <h2 className="day-title display">{fmtDay(dayIdx)}</h2>
        <span className="day-count mono">{matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}</span>
      </div>
      <div className="grid">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} defaultLang={defaultLang} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
