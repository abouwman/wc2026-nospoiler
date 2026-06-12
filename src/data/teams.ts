import type { Team } from '../types';

// World Cup No Spoiler — sample tournament data
// NOTE: groups/fixtures are SAMPLE data (plausible, not the real 2026 draw).

export const TEAMS: Record<string, Team> = {
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
};

export const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('');

export const GROUPS: Record<string, string[]> = {
  A: ['MEX', 'KOR', 'POL', 'TUN'],
  B: ['CAN', 'SUI', 'CIV', 'QAT'],
  C: ['USA', 'NOR', 'EGY', 'NZL'],
  D: ['ARG', 'DEN', 'NGA', 'UZB'],
  E: ['BRA', 'TUR', 'IRN', 'SCO'],
  F: ['FRA', 'COL', 'JOR', 'AUS'],
  G: ['ENG', 'SEN', 'ECU', 'KSA'],
  H: ['ESP', 'JPN', 'GHA', 'PAN'],
  I: ['GER', 'URU', 'ALG', 'CRC'],
  J: ['NED', 'MAR', 'PAR', 'JAM'],
  K: ['POR', 'AUT', 'CMR', 'RSA'],
  L: ['CRO', 'SRB', 'CHI', 'CUW'],
};

export const VENUES = [
  'Estadio Azteca · Mexico City', 'Estadio BBVA · Monterrey', 'Estadio Akron · Guadalajara',
  'BMO Field · Toronto', 'BC Place · Vancouver', 'MetLife Stadium · New York NJ',
  'SoFi Stadium · Los Angeles', 'AT&T Stadium · Dallas', 'NRG Stadium · Houston',
  'Arrowhead Stadium · Kansas City', 'Mercedes-Benz Stadium · Atlanta', 'Hard Rock Stadium · Miami',
  'Lincoln Financial Field · Philadelphia', "Levi's Stadium · SF Bay Area",
  'Lumen Field · Seattle', 'Gillette Stadium · Boston',
];

export const TIMES = ['12:00', '15:00', '18:00', '21:00'];
