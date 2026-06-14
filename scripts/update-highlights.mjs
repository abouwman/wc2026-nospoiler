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

// FIFA highlights hub — scraped (best-effort) for per-match watch ids.
const FIFA_HUB = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/highlights';
const UA = 'Mozilla/5.0 (compatible; HoldTheScoreBot/1.0)';

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
  HAI: { en: ['haiti'], nl: 'Haïti' },
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

// search.list (order=date) is incomplete for listing a channel's uploads, so for
// a full/reliable recent-uploads list we read the channel's uploads playlist.
async function uploadsPlaylistId(chId) {
  const data = await yt('/channels', { part: 'contentDetails', id: chId });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function channelUploads(chId) {
  const playlistId = await uploadsPlaylistId(chId);
  if (!playlistId) return [];
  const data = await yt('/playlistItems', { part: 'snippet', playlistId, maxResults: '50' });
  return (data.items || []).map((i) => ({
    id: i.snippet.resourceId.videoId, title: i.snippet.title, publishedAt: i.snippet.publishedAt,
  }));
}

async function recentUploads(chId, q) {
  const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString();
  const params = {
    part: 'snippet', channelId: chId, type: 'video',
    order: 'date', maxResults: '50', publishedAfter,
  };
  if (q) params.q = q;
  const data = await yt('/search', params);
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

// --- Dutch (NOS Sport) title parsing ---------------------------------------
const NL_TO_CODE = new Map();
for (const [code, t] of Object.entries(TEAMS)) if (t.nl) NL_TO_CODE.set(norm(t.nl), code);
const NL_ALIASES = {
  TUR: ['turkije', 'turkiye'],
  BIH: ['bosnie en herzegovina', 'bosnie-herzegovina', 'bosnie'],
  USA: ['verenigde staten', 'vs'],
  KOR: ['zuid-korea', 'korea'],
  RSA: ['zuid-afrika'],
  CIV: ['ivoorkust'],
  CZE: ['tsjechie'],
};

function codeFromDutch(name) {
  const n = norm(name);
  if (NL_TO_CODE.has(n)) return NL_TO_CODE.get(n);
  let best = null, len = 0;
  for (const [alias, code] of NL_TO_CODE) if (n.includes(alias) && alias.length > len) { best = code; len = alias.length; }
  for (const [code, aliases] of Object.entries(NL_ALIASES))
    for (const a of aliases) { const na = norm(a); if (n.includes(na) && na.length > len) { best = code; len = na.length; } }
  return best;
}

// NOS titles look like "Samenvatting Zuid-Korea - Tsjechië | Groep A | WK2026 ⚽"
// or "Verenigde Staten - Paraguay | Groep D | WK2026". Teams are separated by
// " - " (team-internal hyphens, e.g. Zuid-Korea, have no surrounding spaces).
function parseDutch(title) {
  if (/\blive\b/i.test(title)) return null;
  const cleaned = title.replace(/[🌎🏆™⚽️🔴]/g, ' ').replace(/#\S+/g, ' ').replace(/\s+/g, ' ').trim();
  const head = cleaned.split('|')[0].trim();
  const parts = head.split(/\s+[-–]\s+/);
  if (parts.length < 2) return null;
  const home = codeFromDutch(parts[0]);
  const away = codeFromDutch(parts[1]);
  if (!home || !away || home === away) return null;
  return { home, away };
}

// Best-effort: scrape the FIFA highlights hub for "/en/watch/<id>" links and map
// each to a match by the team names near the link. Non-fatal if the markup
// changes or the page is JS-rendered — the app falls back to the hub URL.
async function discoverFifa() {
  const map = new Map();
  let html;
  try {
    const res = await fetch(FIFA_HUB, { headers: { 'user-agent': UA, 'accept-language': 'en' } });
    console.log(`fifa hub: ${res.status} ${res.headers.get('content-type')}`);
    if (!res.ok) throw new Error('hub ' + res.status);
    html = await res.text();
  } catch (e) { console.warn('fifa hub fetch failed:', e.message); return map; }

  const watchIds = [...html.matchAll(/watch\/([A-Za-z0-9_-]{18,26})/g)].map((m) => m[1]);
  const titles = [...html.matchAll(/"title"\s*:\s*"([^"]*(?:[Hh]ighlights|[ -]v[s. ][^"]*)[^"]*)"/g)].map((m) => m[1]);
  console.log(`fifa hub len=${html.length} nextData=${html.includes('__NEXT_DATA__')} watchIds=${watchIds.length} titles=${titles.length}`);
  console.log('FIFA_WATCHIDS ' + JSON.stringify([...new Set(watchIds)].slice(0, 30)));
  console.log('FIFA_TITLES ' + JSON.stringify(titles.slice(0, 30)));

  const re = /\/en\/watch\/([A-Za-z0-9_-]{8,})([\s\S]{0,240})/g;
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const tm = text.match(/(.+?)\s+(?:vs?|v)\.?\s+(.+?)(?:\s*[|–\-•]|$)/i);
    if (!tm) continue;
    const home = codeFromEnglish(tm[1]);
    const away = codeFromEnglish(tm[2]);
    if (home && away && home !== away) {
      const key = `${home}-${away}`;
      if (!map.has(key)) map.set(key, id);
    }
  }
  return map;
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

  // 2) Dutch summaries — list recent NOS Sport uploads and parse their titles
  //    (prefer the full "samenvatting" over goal clips).
  if (ids.nos) {
    let vids = [];
    try { vids = await channelUploads(ids.nos); }
    catch (e) { console.warn(`nos uploads failed: ${e.message}`); }
    for (const preferSamenvatting of [true, false]) {
      for (const v of vids) {
        if (/samenvatting/i.test(v.title) !== preferSamenvatting) continue;
        const p = parseDutch(v.title);
        if (!p) continue;
        const match = byId.get(`m-${p.home.toLowerCase()}-${p.away.toLowerCase()}`)
          || byId.get(`m-${p.away.toLowerCase()}-${p.home.toLowerCase()}`);
        if (!match || match.videos.nl?.short) continue;
        setClip(match, 'nl', 'short', v.id, 'NL');
        console.log(`nl for ${match.id}: ${v.id} (${v.title})`);
      }
    }
  }

  // 3) FIFA International links per match (best-effort scrape).
  const fifaMap = await discoverFifa();
  console.log(`fifa watch ids found: ${fifaMap.size}`);
  for (const match of byId.values()) {
    if (match.fifa) continue;
    const id = fifaMap.get(`${match.home}-${match.away}`);
    if (id) { match.fifa = id; console.log(`fifa for ${match.id}: ${id}`); }
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
