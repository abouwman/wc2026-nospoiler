import type { Team } from '../types';

// Team reference data — flags and [base, slash] panel colours drawn from each
// flag/kit. Fixtures and results live in data/schedule.ts (real, played-only).

// A new World Cup team can appear in the generated data before it's added
// here. Rather than crash the whole app (TEAMS[code].name on undefined blanks
// the page), fall back to a neutral placeholder so the match still renders.
const fallbackTeam = (code: string): Team => ({ name: code, flag: '🏳️', colors: ['#555770', '#3a3c4e'] });

const RAW_TEAMS: Record<string, Team> = {
  MEX: { name: 'Mexico', flag: '🇲🇽', colors: ['#006847', '#CE1126'] },
  KOR: { name: 'South Korea', flag: '🇰🇷', colors: ['#0047A0', '#CD2E3A'] },
  POL: { name: 'Poland', flag: '🇵🇱', colors: ['#D4213D', '#8F1226'] },
  TUN: { name: 'Tunisia', flag: '🇹🇳', colors: ['#E70013', '#9F000D'] },
  CAN: { name: 'Canada', flag: '🇨🇦', colors: ['#D52B1E', '#8F1C12'] },
  SUI: { name: 'Switzerland', flag: '🇨🇭', colors: ['#DA291C', '#9C1D12'] },
  CIV: { name: "Côte d'Ivoire", flag: '🇨🇮', colors: ['#F77F00', '#009A44'] },
  QAT: { name: 'Qatar', flag: '🇶🇦', colors: ['#8A1538', '#5C0E25'] },
  USA: { name: 'United States', flag: '🇺🇸', colors: ['#3C3B6E', '#B22234'] },
  NOR: { name: 'Norway', flag: '🇳🇴', colors: ['#BA0C2F', '#00205B'] },
  EGY: { name: 'Egypt', flag: '🇪🇬', colors: ['#C8102E', '#1A1A1E'] },
  NZL: { name: 'New Zealand', flag: '🇳🇿', colors: ['#101820', '#36405E'] },
  ARG: { name: 'Argentina', flag: '🇦🇷', colors: ['#5BA3D0', '#2F6F9E'] },
  DEN: { name: 'Denmark', flag: '🇩🇰', colors: ['#C8102E', '#85091E'] },
  NGA: { name: 'Nigeria', flag: '🇳🇬', colors: ['#008753', '#005231'] },
  UZB: { name: 'Uzbekistan', flag: '🇺🇿', colors: ['#0099B5', '#1EB53A'] },
  BRA: { name: 'Brazil', flag: '🇧🇷', colors: ['#009739', '#FEDD00'] },
  TUR: { name: 'Türkiye', flag: '🇹🇷', colors: ['#E30A17', '#9E060F'] },
  IRN: { name: 'Iran', flag: '🇮🇷', colors: ['#239F40', '#DA0000'] },
  SCO: { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', colors: ['#005EB8', '#003A73'] },
  FRA: { name: 'France', flag: '🇫🇷', colors: ['#002395', '#ED2939'] },
  COL: { name: 'Colombia', flag: '🇨🇴', colors: ['#003893', '#FCD116'] },
  JOR: { name: 'Jordan', flag: '🇯🇴', colors: ['#007A3D', '#CE1126'] },
  AUS: { name: 'Australia', flag: '🇦🇺', colors: ['#00843D', '#FFCD00'] },
  ENG: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#CE1124', '#88060F'] },
  SEN: { name: 'Senegal', flag: '🇸🇳', colors: ['#00853F', '#FDEF42'] },
  ECU: { name: 'Ecuador', flag: '🇪🇨', colors: ['#0072CE', '#FFD100'] },
  KSA: { name: 'Saudi Arabia', flag: '🇸🇦', colors: ['#006C35', '#00441F'] },
  ESP: { name: 'Spain', flag: '🇪🇸', colors: ['#AA151B', '#F1BF00'] },
  JPN: { name: 'Japan', flag: '🇯🇵', colors: ['#BC002D', '#7D001D'] },
  GHA: { name: 'Ghana', flag: '🇬🇭', colors: ['#006B3F', '#CE1126'] },
  PAN: { name: 'Panama', flag: '🇵🇦', colors: ['#005293', '#DA121A'] },
  GER: { name: 'Germany', flag: '🇩🇪', colors: ['#1F1F1F', '#DD0000'] },
  URU: { name: 'Uruguay', flag: '🇺🇾', colors: ['#418FDE', '#2A6CAB'] },
  ALG: { name: 'Algeria', flag: '🇩🇿', colors: ['#006233', '#D21034'] },
  CRC: { name: 'Costa Rica', flag: '🇨🇷', colors: ['#002B7F', '#CE1126'] },
  NED: { name: 'Netherlands', flag: '🇳🇱', colors: ['#FF6A13', '#21468B'] },
  MAR: { name: 'Morocco', flag: '🇲🇦', colors: ['#C1272D', '#006233'] },
  PAR: { name: 'Paraguay', flag: '🇵🇾', colors: ['#D52B1E', '#0038A8'] },
  JAM: { name: 'Jamaica', flag: '🇯🇲', colors: ['#009B3A', '#FED100'] },
  POR: { name: 'Portugal', flag: '🇵🇹', colors: ['#046A38', '#DA291C'] },
  AUT: { name: 'Austria', flag: '🇦🇹', colors: ['#ED2939', '#A91D28'] },
  CMR: { name: 'Cameroon', flag: '🇨🇲', colors: ['#007A5E', '#CE1126'] },
  RSA: { name: 'South Africa', flag: '🇿🇦', colors: ['#007749', '#E03C31'] },
  CRO: { name: 'Croatia', flag: '🇭🇷', colors: ['#DD0000', '#171796'] },
  SRB: { name: 'Serbia', flag: '🇷🇸', colors: ['#C6363C', '#0C4076'] },
  CHI: { name: 'Chile', flag: '🇨🇱', colors: ['#D52B1E', '#0039A6'] },
  CUW: { name: 'Curaçao', flag: '🇨🇼', colors: ['#002B7F', '#F9E814'] },
  CZE: { name: 'Czechia', flag: '🇨🇿', colors: ['#D7141A', '#11457E'] },
  BIH: { name: 'Bosnia & Herzegovina', flag: '🇧🇦', colors: ['#002F6C', '#FECB00'] },
  HAI: { name: 'Haiti', flag: '🇭🇹', colors: ['#00209F', '#D21034'] },
  SWE: { name: 'Sweden', flag: '🇸🇪', colors: ['#006AA7', '#FECC02'] },
  BEL: { name: 'Belgium', flag: '🇧🇪', colors: ['#1A1A1A', '#EF3340'] },
  CPV: { name: 'Cape Verde', flag: '🇨🇻', colors: ['#003893', '#CF2027'] },
};

export const TEAMS: Record<string, Team> = new Proxy(RAW_TEAMS, {
  get: (target, prop) => {
    if (typeof prop !== 'string' || prop in target) return (target as Record<string | symbol, unknown>)[prop as string];
    return fallbackTeam(prop);
  },
});
