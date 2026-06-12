import { TEAMS } from '../data/teams';

function teamPanelStyle(code: string): React.CSSProperties {
  const c = TEAMS[code].colors;
  return { background: `linear-gradient(135deg, ${c[0]} 0%, ${c[0]} 62%, ${c[1]} 62.4%)` };
}

interface TeamPanelProps {
  code: string | null;
  label?: string;
}

export function TeamPanel({ code, label }: TeamPanelProps) {
  if (!code) {
    return (
      <div className="team-panel tbd">
        <span className="panel-code display">TBD</span>
        <span className="panel-label mono">{label || 'To be decided'}</span>
      </div>
    );
  }
  const t = TEAMS[code];
  return (
    <div className="team-panel" style={teamPanelStyle(code)}>
      <span className="panel-flag" aria-hidden="true">{t.flag}</span>
      <span className="panel-code display">{code}</span>
    </div>
  );
}
