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

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

// fifa.com itself is JS-rendered and bot-blocks datacenter IPs (returns a tiny
// fifa.com is JS-rendered and bot-blocks datacenter IPs, so we can't scrape it.
// Resolve each match's official fifa.com/watch id via a search API instead.
// Configure ONE provider (Bing Search v7 is retired):
//   - SERPAPI_KEY                       (serpapi.com)
//   - GOOGLE_CSE_KEY + GOOGLE_CSE_CX    (Google Programmable Search JSON API)
//   - BRAVE_API_KEY                     (Brave Search API)
// Returns search results as { url, text } where text is title + snippet.
async function searchResults(query) {
  const { SERPAPI_KEY, GOOGLE_CSE_KEY, GOOGLE_CSE_CX, BRAVE_API_KEY } = process.env;
  try {
    if (SERPAPI_KEY) {
      const u = 'https://serpapi.com/search.json?engine=google&num=10&q=' + encodeURIComponent(query) + '&api_key=' + SERPAPI_KEY;
      const r = await fetch(u);
      if (!r.ok) { console.warn(`serpapi ${r.status}`); return []; }
      const j = await r.json();
      return (j.organic_results || []).map((x) => ({ url: x.link, text: `${x.title || ''} ${x.snippet || ''}` })).filter((x) => x.url);
    }
    if (GOOGLE_CSE_KEY && GOOGLE_CSE_CX) {
      const u = 'https://www.googleapis.com/customsearch/v1?num=10&key=' + GOOGLE_CSE_KEY + '&cx=' + GOOGLE_CSE_CX + '&q=' + encodeURIComponent(query);
      const r = await fetch(u);
      if (!r.ok) { console.warn(`google cse ${r.status}`); return []; }
      const j = await r.json();
      return (j.items || []).map((x) => ({ url: x.link, text: `${x.title || ''} ${x.snippet || ''}` })).filter((x) => x.url);
    }
    if (BRAVE_API_KEY) {
      const u = 'https://api.search.brave.com/res/v1/web/search?count=20&q=' + encodeURIComponent(query);
      const r = await fetch(u, { headers: { 'X-Subscription-Token': BRAVE_API_KEY, Accept: 'application/json' } });
      if (!r.ok) { console.warn(`brave ${r.status}`); return []; }
      const j = await r.json();
      return (j.web?.results || []).map((x) => ({ url: x.url, text: `${x.title || ''} ${x.description || ''}` })).filter((x) => x.url);
    }
  } catch (e) { console.warn('search provider failed:', e.message); }
  return [];
}

// Older World Cup editions whose highlights must never be picked for WC 2026.
const OLD_EDITION = /\b(2002|2006|2010|2014|2018|2022)\b|russia 2018|qatar 2022|brazil 2014|south africa 2010/i;
// fifa.com serves watch pages as both /en/watch/<id> and /fifaplus/en/watch/<id>.
const WATCH_URL = /fifa\.com\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/i;

// Punctuation/diacritic-insensitive form for name matching, e.g.
// "Côte d'Ivoire" -> "cote d ivoire", "Curaçao" -> "curacao". Without this the
// apostrophe/accent caused legitimate results to be rejected.
const matchNorm = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
const mentions = (text, names) => {
  const t = matchNorm(text);
  return names.some((n) => {
    const k = matchNorm(n);
    return k.length > 0 && new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t);
  });
};

// Resolve a match's fifa.com/watch id. homeNames/awayNames are the known name
// variants for each team. A result only counts if its title/snippet mentions a
// variant of BOTH teams and is not an older edition — this stops the search from
// returning a 2018/2022 clip that merely shares one team name.
async function fifaWatchId(homeNames, awayNames) {
  const [home, away] = [homeNames[0], awayNames[0]];
  const results = await searchResults(`${home} vs ${away} highlights FIFA World Cup 2026 watch site:fifa.com`);
  for (const { url, text } of results) {
    const m = String(url).match(WATCH_URL);
    if (!m) continue;
    if (OLD_EDITION.test(text)) continue;
    if (!mentions(text, homeNames) || !mentions(text, awayNames)) continue;
    return m[1];
  }
  return null;
}

// --- BBC iPlayer (UK only) --------------------------------------------------
// The World Cup 2026 highlights live in one iPlayer programme group. The "ibl"
// API lists that group's episodes as JSON; we match each episode to a match by
// both team names (same rules as FIFA). Override the group via BBC_GROUP_ID.
const BBC_GROUP = process.env.BBC_GROUP_ID || 'm002v7zq';
const BBC_PID = /^[bmp][0-9a-z]{7}$/;

// Collect { id, text } for every episode-like object in the API response,
// defensively (the ibl schema nests episodes under a few shapes).
function collectBbcEpisodes(node, out, acc = new Set()) {
  if (Array.isArray(node)) { for (const x of node) collectBbcEpisodes(x, out, acc); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.id === 'string' && BBC_PID.test(node.id) && !acc.has(node.id)) {
    const text = [node.title, node.subtitle, node.editorial_title, node.editorial_subtitle,
      node.complete_title, node.synopses?.small, node.synopses?.medium].filter(Boolean).join(' ');
    if (text) { acc.add(node.id); out.push({ id: node.id, text }); }
  }
  for (const k of Object.keys(node)) collectBbcEpisodes(node[k], out, acc);
}

async function bbcEpisodes() {
  const url = `https://ibl.api.bbc.co.uk/ibl/v1/groups/${BBC_GROUP}/episodes?per_page=200`;
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
    if (!r.ok) { console.warn(`bbc ibl ${r.status}`); return []; }
    const out = [];
    collectBbcEpisodes(await r.json(), out);
    return out;
  } catch (e) { console.warn('bbc ibl failed:', e.message); return []; }
}

function bbcEpisodeId(episodes, homeNames, awayNames) {
  for (const { id, text } of episodes) {
    if (OLD_EDITION.test(text)) continue;
    if (!mentions(text, homeNames) || !mentions(text, awayNames)) continue;
    return id;
  }
  return null;
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

  // 3) External per-match highlight links for played matches:
  //    FIFA International (worldwide) via search API, BBC iPlayer (UK only).
  const nowMs = Date.now();
  const bbcEps = await bbcEpisodes();
  console.log(`bbc episodes: ${bbcEps.length}`);
  for (const match of byId.values()) {
    const hasVid = Object.values(match.videos).some((c) => c && (c.short || c.extended));
    const played = hasVid || (match.kickoff && new Date(match.kickoff).getTime() < nowMs);
    if (!played) continue;
    const hn = TEAMS[match.home]?.en, an = TEAMS[match.away]?.en;
    if (!hn?.length || !an?.length) continue;
    if (!match.fifa) {
      const id = await fifaWatchId(hn, an);
      if (id) { match.fifa = id; console.log(`fifa for ${match.id}: ${id}`); }
    }
    if (!match.bbc && bbcEps.length) {
      const id = bbcEpisodeId(bbcEps, hn, an);
      if (id) { match.bbc = id; console.log(`bbc for ${match.id}: ${id}`); }
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
