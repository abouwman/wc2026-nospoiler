// Auto-discovers World Cup 2026 highlight clips and updates
// src/data/matches.generated.json. Designed to run from a scheduled GitHub
// Action (see .github/workflows/update-highlights.yml).
//
// How it works (no scores / results API needed — a published highlight IS the
// signal that a match was played):
//   1. Read recent uploads from the EN channels (FIFA, FOX Sports) via the
//      YouTube Data API, scoped by channel, and parse "TeamA vs TeamB …
//      Highlights" titles into matches + short/extended cuts.
//   2. For each match, find the NOS Sport (NL) "Samenvatting" on its channel.
//   3. Merge into matches.generated.json without overwriting existing entries.
//
// Requires env YOUTUBE_API_KEY. Channel handles can be overridden via
// FIFA_HANDLE / FOX_HANDLE / NOS_HANDLE. Safe to re-run (idempotent).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error('Missing YOUTUBE_API_KEY'); process.exit(1); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '../src/data/matches.generated.json');

const HANDLES = {
  fifa: process.env.FIFA_HANDLE || 'fifa',
  fox: process.env.FOX_HANDLE || 'foxsports',
  nos: process.env.NOS_HANDLE || 'nossport',
};

// How far back to look for new uploads.
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS || 4);

// --- Team metadata: code -> { en: [aliases], nl: 'Dutch name' } -------------
// en aliases are matched case-insensitively against parsed title fragments.
const TEAMS = {
  MEX: { en: ['mexico'], nl: 'Mexico' },
  KOR: { en: ['south korea', 'korea republic', 'korea'], nl: 'Zuid-Korea' },
  POL: { en: ['poland'], nl: 'Polen' },
  TUN: { en: ['tunisia'], nl: 'Tunesië' },
  CAN: { en: ['canada'], nl: 'Canada' },
  SUI: { en: ['switzerland'], nl: 'Zwitserland' },
  CIV: { en: ["côte d'ivoire", "cote d'ivoire", 'ivory coast'], nl: 'Ivoorkust' },
  QAT: { en: ['qatar'], nl: 'Qatar' },
  USA: { en: ['united states', 'usa', 'us', 'united states of america'], nl: 'Verenigde Staten' },
  NOR: { en: ['norway'], nl: 'Noorwegen' },
  EGY: { en: ['egypt'], nl: 'Egypte' },
  NZL: { en: ['new zealand'], nl: 'Nieuw-Zeeland' },
  ARG: { en: ['argentina'], nl: 'Argentinië' },
  DEN: { en: ['denmark'], nl: 'Denemarken' },
  NGA: { en: ['nigeria'], nl: 'Nigeria' },
  UZB: { en: ['uzbekistan'], nl: 'Oezbekistan' },
  BRA: { en: ['brazil'], nl: 'Brazilië' },
  TUR: { en: ['türkiye', 'turkiye', 'turkey'], nl: 'Turkije' },
  IRN: { en: ['iran', 'ir iran'], nl: 'Iran' },
  SCO: { en: ['scotland'], nl: 'Schotland' },
  FRA: { en: ['france'], nl: 'Frankrijk' },
  COL: { en: ['colombia'], nl: 'Colombia' },
  JOR: { en: ['jordan'], nl: 'Jordanië' },
  AUS: { en: ['australia'], nl: 'Australië' },
  ENG: { en: ['england'], nl: 'Engeland' },
  SEN: { en: ['senegal'], nl: 'Senegal' },
  ECU: { en: ['ecuador'], nl: 'Ecuador' },
  KSA: { en: ['saudi arabia'], nl: 'Saoedi-Arabië' },
  ESP: { en: ['spain'], nl: 'Spanje' },
  JPN: { en: ['japan'], nl: 'Japan' },
  GHA: { en: ['ghana'], nl: 'Ghana' },
  PAN: { en: ['panama'], nl: 'Panama' },
  GER: { en: ['germany'], nl: 'Duitsland' },
  URU: { en: ['uruguay'], nl: 'Uruguay' },
  ALG: { en: ['algeria'], nl: 'Algerije' },
  CRC: { en: ['costa rica'], nl: 'Costa Rica' },
  NED: { en: ['netherlands', 'holland'], nl: 'Nederland' },
  MAR: { en: ['morocco'], nl: 'Marokko' },
  PAR: { en: ['paraguay'], nl: 'Paraguay' },
  JAM: { en: ['jamaica'], nl: 'Jamaica' },
  POR: { en: ['portugal'], nl: 'Portugal' },
  AUT: { en: ['austria'], nl: 'Oostenrijk' },
  CMR: { en: ['cameroon'], nl: 'Kameroen' },
  RSA: { en: ['south africa'], nl: 'Zuid-Afrika' },
  CRO: { en: ['croatia'], nl: 'Kroatië' },
  SRB: { en: ['serbia'], nl: 'Servië' },
  CHI: { en: ['chile'], nl: 'Chili' },
  CUW: { en: ['curaçao', 'curacao'], nl: 'Curaçao' },
  CZE: { en: ['czechia', 'czech republic'], nl: 'Tsjechië' },
  BIH: { en: ['bosnia and herzegovina', 'bosnia & herzegovina', 'bosnia'], nl: 'Bosnië en Herzegovina' },
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const EN_TO_CODE = new Map();
for (const [code, m] of Object.entries(TEAMS)) for (const a of m.en) EN_TO_CODE.set(norm(a), code);

function codeFromEnglish(name) {
  const n = norm(name);
  if (EN_TO_CODE.has(n)) return EN_TO_CODE.get(n);
  // longest alias contained in the fragment (handles trailing words)
  let best = null, bestLen = 0;
  for (const [alias, code] of EN_TO_CODE) {
    if (n.includes(alias) && alias.length > bestLen) { best = code; bestLen = alias.length; }
  }
  return best;
}

// --- YouTube Data API helpers ----------------------------------------------
async function yt(path, params) {
  const url = new URL(API + path);
  url.search = new URLSearchParams({ ...params, key: KEY }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function channelId(handle) {
  const data = await yt('/channels', { part: 'id', forHandle: handle });
  return data.items?.[0]?.id || null;
}

async function recentUploads(chId, q) {
  const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString();
  const data = await yt('/search', {
    part: 'snippet', channelId: chId, q, type: 'video',
    order: 'date', maxResults: '50', publishedAfter,
  });
  return (data.items || []).map((i) => ({
    id: i.id.videoId, title: i.snippet.title, publishedAt: i.snippet.publishedAt,
  }));
}

// --- Title parsing ----------------------------------------------------------
function parseEnglish(title) {
  if (!/highlights/i.test(title)) return null;
  if (!/(fifa world cup 2026|2026 fifa world cup|world cup 2026)/i.test(title)) return null;
  const cleaned = title.replace(/[🌎🏆™]/g, ' ').replace(/\s+/g, ' ').trim();
  const head = cleaned.split('|')[0].trim();
  const m = head.match(/^(.+?)\s+vs?\.?\s+(.+?)(?:\s+extended)?(?:\s+match)?(?:\s+highlights.*)?$/i);
  if (!m) return null;
  const home = codeFromEnglish(m[1]);
  const away = codeFromEnglish(m[2]);
  if (!home || !away || home === away) return null;
  const group = (cleaned.match(/group\s+([A-L])\b/i) || [])[1]?.toUpperCase();
  const extended = /extended/i.test(cleaned);
  return { home, away, group, extended };
}

// --- Merge helpers ----------------------------------------------------------
function setClip(match, lang, variant, id, geo) {
  match.videos[lang] = match.videos[lang] || {};
  if (!match.videos[lang][variant]) match.videos[lang][variant] = geo ? { id, geo } : { id };
}

async function main() {
  const existing = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const byId = new Map(existing.map((m) => [m.id, m]));

  const ids = {};
  for (const [k, h] of Object.entries(HANDLES)) {
    try { ids[k] = await channelId(h); console.log(`channel ${k} (@${h}) -> ${ids[k]}`); }
    catch (e) { console.warn(`channel ${k} resolve failed: ${e.message}`); }
  }

  // 1) English highlights from FIFA (preferred) then FOX.
  for (const ch of ['fifa', 'fox']) {
    if (!ids[ch]) continue;
    let vids = [];
    try { vids = await recentUploads(ids[ch], 'highlights world cup 2026'); }
    catch (e) { console.warn(`${ch} search failed: ${e.message}`); continue; }
    for (const v of vids) {
      const p = parseEnglish(v.title);
      if (!p) continue;
      const id = `m-${p.home.toLowerCase()}-${p.away.toLowerCase()}`;
      let match = byId.get(id);
      if (!match) {
        match = {
          id, stage: 'group', date: v.publishedAt.slice(0, 10),
          home: p.home, away: p.away, videos: {},
        };
        if (p.group) match.group = p.group;
        byId.set(id, match);
        console.log(`new match: ${id} (${p.home} v ${p.away})`);
      }
      if (p.group && !match.group) match.group = p.group;
      setClip(match, 'en', p.extended ? 'extended' : 'short', v.id, 'US');
    }
  }

  // 2) Dutch summaries from NOS Sport for every known match.
  if (ids.nos) {
    for (const match of byId.values()) {
      if (match.videos.nl?.short) continue;
      const home = TEAMS[match.home]?.nl, away = TEAMS[match.away]?.nl;
      if (!home || !away) continue;
      let vids = [];
      try { vids = await recentUploads(ids.nos, `${home} ${away} samenvatting`); }
      catch (e) { console.warn(`nos search failed: ${e.message}`); break; }
      const hit = vids.find((v) => norm(v.title).includes(norm(home)) && norm(v.title).includes(norm(away)));
      if (hit) { setClip(match, 'nl', 'short', hit.id, 'NL'); console.log(`nl for ${match.id}: ${hit.id}`); }
    }
  }

  const out = [...byId.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const next = JSON.stringify(out, null, 2) + '\n';
  if (next !== readFileSync(DATA_FILE, 'utf8')) {
    writeFileSync(DATA_FILE, next);
    console.log(`updated ${DATA_FILE} (${out.length} matches)`);
  } else {
    console.log('no changes');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
