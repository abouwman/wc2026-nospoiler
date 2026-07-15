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

// Optional: the official fixture list (kickoff times, stage, group) so upcoming
// matches render before any highlight exists. Free token from football-data.org
// (X-Auth-Token). Without it the script just skips fixtures (highlights only).
const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const FD_COMP = process.env.FOOTBALL_DATA_COMP || 'WC';
const FD_STAGE = {
  GROUP_STAGE: 'group', LAST_32: 'r32', LAST_16: 'r16',
  QUARTER_FINALS: 'qf', SEMI_FINALS: 'sf', THIRD_PLACE: 'third', FINAL: 'final',
};

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
  IRQ: { en: ['iraq'], nl: 'Irak' },
  COD: { en: ['dr congo', 'congo dr', 'democratic republic of congo', 'democratic republic of the congo'], nl: 'DR Congo' },
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
  SWE: { en: ['sweden'], nl: 'Zweden' },
  BEL: { en: ['belgium'], nl: 'België' },
  CPV: { en: ['cape verde', 'cabo verde', 'cape verde islands'], nl: 'Kaapverdië' },
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Punctuation/diacritic-insensitive form for name matching, e.g.
// "Côte d'Ivoire" -> "cote d ivoire", "Saoedi-Arabië" / "Saoedi Arabië" ->
// "saoedi arabie". Collapsing hyphens, spaces, apostrophes and accents to a
// single canonical form means alternate spellings/separators still match.
const matchNorm = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
// True when `needle` (a name) appears as a whole word-sequence in `haystack`.
const containsName = (haystack, needle) => {
  const h = matchNorm(haystack), k = matchNorm(needle);
  return k.length > 0 && new RegExp(`(?:^| )${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: |$)`).test(h);
};

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

// search.list (order=date) is both incomplete for listing a channel's uploads
// AND expensive (100 quota units/call), so we read the channel's uploads
// playlist instead (1 unit/page) — reliable and ~100x cheaper.
async function uploadsPlaylistId(chId) {
  const data = await yt('/channels', { part: 'contentDetails', id: chId });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function channelUploads(chId, max = 50) {
  const playlistId = await uploadsPlaylistId(chId);
  if (!playlistId) return [];
  const out = [];
  let pageToken;
  do {
    const params = { part: 'snippet', playlistId, maxResults: '50' };
    if (pageToken) params.pageToken = pageToken;
    const data = await yt('/playlistItems', params);
    for (const i of data.items || []) out.push({
      id: i.snippet.resourceId.videoId, title: i.snippet.title, publishedAt: i.snippet.publishedAt,
    });
    pageToken = data.nextPageToken;
  } while (pageToken && out.length < max);
  return out;
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
// Keys are matchNorm-ed so hyphen/space/accent variants (e.g. "Saoedi-Arabië"
// vs "Saoedi Arabië") all collapse to the same lookup form.
const NL_TO_CODE = new Map();
for (const [code, t] of Object.entries(TEAMS)) if (t.nl) NL_TO_CODE.set(matchNorm(t.nl), code);
const NL_ALIASES = {
  TUR: ['turkije', 'turkiye'],
  BIH: ['bosnie en herzegovina', 'bosnie-herzegovina', 'bosnie'],
  USA: ['verenigde staten', 'vs'],
  KOR: ['zuid-korea', 'korea'],
  RSA: ['zuid-afrika'],
  CIV: ['ivoorkust'],
  CZE: ['tsjechie'],
  KSA: ['saudi-arabie', 'saudi arabie'],
};

function codeFromDutch(name) {
  const n = matchNorm(name);
  if (NL_TO_CODE.has(n)) return NL_TO_CODE.get(n);
  // Match the longest known name that appears as a whole word-sequence. Using
  // containsName (punctuation/accent-insensitive) instead of a raw substring
  // means "Saoedi Arabië" still resolves even though the alias has a hyphen.
  let best = null, len = 0;
  for (const [alias, code] of NL_TO_CODE) if (containsName(n, alias) && alias.length > len) { best = code; len = alias.length; }
  for (const [code, aliases] of Object.entries(NL_ALIASES))
    for (const a of aliases) { const na = matchNorm(a); if (containsName(n, na) && na.length > len) { best = code; len = na.length; } }
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
// Non-highlight watch pages FIFA publishes for a fixture under the same
// "home v away | …" title (e.g. a pre-match preview). These carry a spoiler and
// must never be attached as a match's highlight link.
const NON_HIGHLIGHT = /\b(preview|line-?ups?|predictions?|build-?up|press conference|how to watch)\b/i;
// fifa.com serves watch pages as both /en/watch/<id> and /fifaplus/en/watch/<id>.
const WATCH_URL = /fifa\.com\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/i;
// A fifa.com/watch id in isolation (same charset/length as WATCH_URL's capture).
const WATCH_ID = /^[A-Za-z0-9_-]{16,26}$/;

// FIFA's own highlights hub, served as JSON by the FIFA+ CXM API. The public hub
// page is JS-rendered and bot-blocks datacenter IPs, but this API lists the new
// videos shortly after a match ends — far faster than waiting for a web search to
// index the fifa.com/watch page. Override the endpoint via FIFA_HIGHLIGHTS_API
// (e.g. to point at a sub-collection endpoint if the page descriptor changes).
const FIFA_HIGHLIGHTS_API = process.env.FIFA_HIGHLIGHTS_API
  || 'https://cxm-api.fifa.com/fifaplusweb/api/pages/en/tournaments/mens/worldcup/canadamexicousa2026/highlights';
// The hub page is only a layout descriptor; its `sections[]` each carry an
// `entryEndpoint` (relative) for the real content. Resolve those against the CXM
// API root (…/fifaplusweb/api/) and crawl only the video-bearing section types.
const FIFA_API_ROOT = (() => {
  const m = FIFA_HIGHLIGHTS_API.match(/^(https?:\/\/.*?\/api)\//i);
  return m ? `${m[1]}/` : new URL('./', FIFA_HIGHLIGHTS_API).toString();
})();
const FIFA_SECTION_TYPES = new Set(['storyTeller', 'sectionPromoCarousel']);

const mentions = (text, names) => names.some((n) => containsName(text, n));

// True when the text STARTS with the exact pairing "home v away" (or the reverse
// order) — accent/punctuation-insensitive. FIFA's per-match watch titles look
// like "Uzbekistan v Colombia | Group K | … | Highlights", so anchoring on the
// pairing rejects roundup/compilation watch pages that merely list many teams
// (those caused one id to be wrongly attached to several matches).
function pairTitle(text, homeNames, awayNames) {
  const t = matchNorm(text);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [a, b] of [[homeNames, awayNames], [awayNames, homeNames]]) {
    for (const x of a) for (const y of b) {
      const X = matchNorm(x), Y = matchNorm(y);
      if (!X || !Y) continue;
      if (new RegExp(`^${esc(X)} (?:v|vs) ${esc(Y)}(?: |$)`).test(t)) return true;
    }
  }
  return false;
}

// Resolve a match's fifa.com/watch id. Tries a few query forms (coverage varies
// per match) and accepts only a watch page whose title is the exact pairing, is a
// Highlights page (not a preview/line-ups spoiler that shares the same title), and
// isn't an older edition.
async function fifaWatchId(homeNames, awayNames) {
  const [home, away] = [homeNames[0], awayNames[0]];
  const queries = [
    `${home} v ${away} highlights site:fifa.com/en/watch`,
    `${home} vs ${away} highlights FIFA World Cup 2026 watch site:fifa.com`,
  ];
  for (const q of queries) {
    let results = [];
    try { results = await searchResults(q); } catch { /* try next */ }
    for (const { url, text } of results) {
      const m = String(url).match(WATCH_URL);
      if (!m) continue;
      if (OLD_EDITION.test(text)) continue;
      if (NON_HIGHLIGHT.test(text)) continue;
      if (!/highlights/i.test(text)) continue;
      if (!pairTitle(text, homeNames, awayNames)) continue;
      return m[1];
    }
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

// --- FIFA highlights hub (worldwide) ----------------------------------------
// A watch link, absolute or relative: "fifa.com/en/watch/<id>" or "/en/watch/<id>"
// (CXM video cards carry the latter in readMorePageUrl).
const WATCH_PATH = /\/(?:fifaplus\/)?(?:[a-z]{2}\/)?watch\/([A-Za-z0-9_-]{16,26})/i;

// Collect { watchId, title } for every *video* object in the FIFA hub JSON,
// defensively (the CXM schema nests entries under several shapes — same approach
// as collectBbcEpisodes). A node only counts as a video when it carries a real
// watch reference: watchDataDto.videoEntryId or a /en/watch/<id> link. Requiring
// that (rather than any id-like field) skips image sub-objects and section
// headers — both of which have a title but are not the highlight video — and the
// id it yields is byte-equal to the public fifa.com/en/watch/<id> link.
function collectFifaItems(node, out, acc = new Set()) {
  if (Array.isArray(node)) { for (const x of node) collectFifaItems(x, out, acc); return; }
  if (!node || typeof node !== 'object') return;
  const title = [node.title, node.name, node.headline, node.shortTitle, node.displayTitle]
    .find((x) => typeof x === 'string' && x.trim());
  let watchId = null;
  const vid = node.watchDataDto?.videoEntryId;
  if (typeof vid === 'string' && WATCH_ID.test(vid)) watchId = vid;
  if (!watchId) {
    for (const v of Object.values(node)) {
      if (typeof v !== 'string') continue;
      const m = v.match(WATCH_PATH);
      if (m) { watchId = m[1]; break; }
    }
  }
  if (title && watchId && !acc.has(watchId)) { acc.add(watchId); out.push({ watchId, title }); }
  for (const k of Object.keys(node)) collectFifaItems(node[k], out, acc);
}

async function fifaJson(url) {
  const r = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json', origin: 'https://www.fifa.com' },
  });
  if (!r.ok) { console.warn(`fifa ${r.status} ${url}`); return null; }
  return r.json();
}

// The hub page is only a layout descriptor: it lists sections, each served from
// its own sub-endpoint. Fetch the page, then crawl the video-bearing sections and
// collect every { watchId, title } across them (shared dedup). If the endpoint is
// overridden to a section URL directly, its entries are collected too.
async function fetchFifaHighlights() {
  let page;
  try { page = await fifaJson(FIFA_HIGHLIGHTS_API); }
  catch (e) { console.warn('fifa hub failed:', e.message); return []; }
  if (!page) return [];
  const out = [], acc = new Set();
  collectFifaItems(page, out, acc);
  const sections = Array.isArray(page.sections) ? page.sections : [];
  for (const s of sections) {
    if (!s?.entryEndpoint || !FIFA_SECTION_TYPES.has(s.entryType)) continue;
    let url, data;
    try { url = new URL(String(s.entryEndpoint).replace(/^\/+/, ''), FIFA_API_ROOT).toString(); } catch { continue; }
    try { data = await fifaJson(url); } catch { continue; }
    if (data) collectFifaItems(data, out, acc);
  }
  if (process.env.DEBUG_FIFA) {
    console.log(`DBG fifa total: ${out.length} items`);
    for (const it of out.slice(0, 50)) console.log(`DBG fifa item: ${it.watchId}  ${it.title}`);
  }
  return out;
}

// Like bbcEpisodeId, but require the exact "home v away" pairing (pairTitle) and a
// "Highlights" title, so a roundup/compilation, preview or gamified-recap entry
// can't be attached as a match's highlight.
function fifaHubMatchId(items, homeNames, awayNames) {
  for (const { watchId, title } of items) {
    if (OLD_EDITION.test(title)) continue;
    if (NON_HIGHLIGHT.test(title)) continue;
    if (!/highlights/i.test(title)) continue;
    if (!pairTitle(title, homeNames, awayNames)) continue;
    return watchId;
  }
  return null;
}

// --- Fixtures (football-data.org) ------------------------------------------
// Resolve an API team to a code. Known names map to our curated codes (which
// carry nice flags/colours in the frontend); an unknown team falls back to the
// API's own three-letter code (tla) and is registered on the fly, so its
// fixture is NEVER dropped and English/FIFA/BBC highlight matching still works.
// Returns null only for genuine TBD slots (no real team name yet).
function resolveTeamCode(team) {
  const name = (team?.name || '').trim();
  if (!name || /^(to be|tbd|winner|runner|loser|group [a-l]\b)/i.test(name)) return null;
  const known = codeFromEnglish(name);
  if (known) return known;
  let code = String(team.tla || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) code = norm(name).replace(/[^a-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  if (!TEAMS[code]) TEAMS[code] = { en: [name], nl: null };
  else if (!TEAMS[code].en.some((a) => norm(a) === norm(name))) TEAMS[code].en.push(name);
  EN_TO_CODE.set(norm(name), code);
  console.log(`registered new team from API: ${code} = ${name}`);
  return code;
}

// Returns [{ home, away, stage, group, kickoff, date }] for every WC match with
// two real teams; only true TBD knockout slots are skipped.
async function fetchFixtures() {
  if (!FD_TOKEN) { console.log('no FOOTBALL_DATA_TOKEN — skipping fixtures'); return []; }
  const url = `https://api.football-data.org/v4/competitions/${FD_COMP}/matches`;
  let data;
  try {
    const r = await fetch(url, { headers: { 'X-Auth-Token': FD_TOKEN, 'User-Agent': UA } });
    if (!r.ok) { console.warn(`football-data ${r.status}`); return []; }
    data = await r.json();
  } catch (e) { console.warn('football-data failed:', e.message); return []; }
  const out = [];
  for (const m of data.matches || []) {
    const home = resolveTeamCode(m.homeTeam);
    const away = resolveTeamCode(m.awayTeam);
    if (!home || !away || home === away) continue;
    const group = (String(m.group || '').match(/([A-L])\b/) || [])[1];
    out.push({
      home, away, stage: FD_STAGE[m.stage] || 'group', group,
      kickoff: m.utcDate, date: (m.utcDate || '').slice(0, 10),
    });
  }
  return out;
}

// --- timesoccertv.com (full-match replays + international highlights) --------
// Per-team article pages embed three players in order: full match 1st half,
// 2nd half, and extended highlights (hosts hgcloud.to / vortexvisionworks). We
// scrape the embed URLs and store them so they can play inside our own modal
// (with credit). Articles are slugged after one team, so we try both teams'
// names and confirm BOTH teams are named near the embeds (right fixture, since
// a team slug later points to that team's next match).
const TSTV_BASE = 'https://timesoccertv.com';
const TSTV_LOOKBACK_MS = Number(process.env.TSTV_LOOKBACK_DAYS || 4) * 864e5;
const TSTV_MAX_PER_RUN = Number(process.env.TSTV_MAX_PER_RUN || 8);
const TSTV_HOSTS = /(?:hgcloud\.to|vortexvisionworks\.com|soccertims\.)/i;
const tstvSlug = (name) => norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function tstvFetch(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

// Pull full-match + highlights embed URLs out of an article, but only if the
// text around the embeds names both teams (confirms this is the right match).
function tstvExtract(html, homeNames, awayNames) {
  const iframes = [...html.matchAll(/<iframe[^>]*\ssrc=["']([^"']+)["']/gi)].filter((m) => TSTV_HOSTS.test(m[1]));
  if (!iframes.length) return null;
  const first = iframes[0].index;
  const around = html.slice(Math.max(0, first - 600), first + 200);
  if (!mentions(around, homeNames) || !mentions(around, awayNames)) return null;
  const full = [];
  let highlights;
  for (const m of iframes) {
    const ctx = html.slice(Math.max(0, m.index - 80), m.index).toLowerCase();
    if (/highlight/.test(ctx)) { if (!highlights) highlights = m[1]; }
    else if (!full.includes(m[1])) full.push(m[1]);
  }
  const out = {};
  if (full.length) out.full = full;
  if (highlights) out.highlights = highlights;
  return Object.keys(out).length ? out : null;
}

async function fetchTstv(match) {
  const hn = TEAMS[match.home]?.en, an = TEAMS[match.away]?.en;
  if (!hn?.length || !an?.length) return null;
  const slugs = [...new Set([...hn, ...an, TEAMS[match.home]?.nl, TEAMS[match.away]?.nl]
    .filter(Boolean).map(tstvSlug).filter(Boolean))].slice(0, 6);
  for (const slug of slugs) {
    for (const suffix of ['-full-match', '-highlights']) {
      const html = await tstvFetch(`${TSTV_BASE}/${slug}${suffix}/`);
      if (!html) continue;
      const found = tstvExtract(html, hn, an);
      if (found) { found.page = `${TSTV_BASE}/${slug}${suffix}/`; return found; }
    }
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

  // 0) Official fixtures: seed/refresh kickoff, stage and group so upcoming
  //    matches appear before any highlight is published. Never touches videos.
  const fixtures = await fetchFixtures();
  console.log(`fixtures: ${fixtures.length}`);
  for (const f of fixtures) {
    const id = `m-${f.home.toLowerCase()}-${f.away.toLowerCase()}`;
    let match = byId.get(id) || byId.get(`m-${f.away.toLowerCase()}-${f.home.toLowerCase()}`);
    if (!match) {
      match = { id, stage: f.stage, date: f.date, home: f.home, away: f.away, videos: {} };
      byId.set(id, match);
      console.log(`fixture match: ${id} (${f.home} v ${f.away}) ${f.kickoff}`);
    }
    if (f.kickoff) { match.kickoff = f.kickoff; match.date = f.date; }
    match.stage = f.stage;
    if (f.group) match.group = f.group;
  }

  const ids = {};
  for (const [k, h] of Object.entries(HANDLES)) {
    try { ids[k] = await channelId(h); console.log(`channel ${k} (@${h}) -> ${ids[k]}`); }
    catch (e) { console.warn(`channel ${k} resolve failed: ${e.message}`); }
  }

  // 1) English highlights from FIFA (preferred) then FOX. Read the uploads
  //    playlist (cheap + reliable) and keep only recent uploads within the
  //    lookback window. EN channels are busy, so scan a few pages deep.
  const enCutoff = Date.now() - LOOKBACK_DAYS * 864e5;
  for (const ch of ['fifa', 'fox']) {
    if (!ids[ch]) continue;
    let vids = [];
    try { vids = await channelUploads(ids[ch], 250); }
    catch (e) { console.warn(`${ch} uploads failed: ${e.message}`); continue; }
    let added = 0;
    for (const v of vids) {
      if (v.publishedAt && new Date(v.publishedAt).getTime() < enCutoff) continue;
      const p = parseEnglish(v.title);
      if (process.env.DEBUG_EN && /highlights|world cup|vs\b/i.test(v.title)) {
        const tag = p ? `[${p.extended ? 'ext' : 'short'} ${p.home}-${p.away}]` : '[no-parse]';
        console.log(`DBG ${ch} ${v.publishedAt?.slice(0, 10)} ${tag} ${v.title}`);
      }
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
      const variant = p.extended ? 'extended' : 'short';
      if (!match.videos.en?.[variant]) {
        setClip(match, 'en', variant, v.id, 'US');
        added++;
        console.log(`en ${variant} for ${id}: ${v.id} (${v.title})`);
      }
    }
    console.log(`${ch}: scanned ${vids.length} uploads, added ${added} en clips`);
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
  // Watch ids already in use, so the same fifa.com page can't be attached to two
  // different matches (the search occasionally returns a shared/hub id).
  const usedFifa = new Set([...byId.values()].map((m) => m.fifa).filter(Boolean));
  // Only *search* for FIFA links once a match has actually finished (kickoff +
  // full playtime + buffer) and is still within the lookback window. Bound the
  // search usage (it's paid/rate-limited): capped per run.
  const fifaCutoff = nowMs - Number(process.env.FIFA_LOOKBACK_DAYS || 5) * 864e5;
  const fifaMaxPerRun = Number(process.env.FIFA_MAX_PER_RUN || 10);
  const fifaEndMs = Number(process.env.FIFA_END_HOURS || 2) * 36e5;
  const fifaEligible = (m) => {
    const ko = m.kickoff ? new Date(m.kickoff).getTime() : 0;
    return ko && ko + fifaEndMs < nowMs && ko >= fifaCutoff;
  };
  const played = (m) => {
    const hasVid = Object.values(m.videos).some((c) => c && (c.short || c.extended));
    const ko = m.kickoff ? new Date(m.kickoff).getTime() : 0;
    return hasVid || (ko && ko < nowMs);
  };
  // FIFA's own highlights hub — one crawl per run, matched against every played
  // match below. The hub lists genuine Highlights only, so it's the source of
  // truth: we crawl whenever a played match with English names exists (to fill
  // gaps AND to re-validate ids already stored — an earlier run could have
  // attached a preview page before the hub posted the real highlight).
  const anyPlayedNamed = [...byId.values()].some((m) => played(m)
    && TEAMS[m.home]?.en?.length && TEAMS[m.away]?.en?.length);
  const fifaItems = (anyPlayedNamed || process.env.DEBUG_FIFA) ? await fetchFifaHighlights() : [];
  console.log(`fifa hub items: ${fifaItems.length}`);
  let fifaTries = 0;
  for (const match of byId.values()) {
    if (!played(match)) continue;
    const hn = TEAMS[match.home]?.en, an = TEAMS[match.away]?.en;
    if (!hn?.length || !an?.length) continue;
    const eligible = fifaEligible(match);
    // The hub is authoritative: whenever it lists this pairing's Highlights,
    // adopt that id — filling an empty link AND overwriting any stored id that
    // differs (self-heals a previously-attached preview/stale page). The web
    // search is only a fallback for a just-finished match the hub hasn't posted.
    const hubId = fifaHubMatchId(fifaItems, hn, an);
    if (hubId && hubId !== match.fifa && !usedFifa.has(hubId)) {
      if (match.fifa) usedFifa.delete(match.fifa);
      match.fifa = hubId; usedFifa.add(hubId);
      console.log(`fifa(hub) for ${match.id}: ${hubId}`);
    }
    if (!match.fifa && eligible && fifaTries < fifaMaxPerRun) {
      fifaTries++;
      const id = await fifaWatchId(hn, an);
      if (id && !usedFifa.has(id)) { match.fifa = id; usedFifa.add(id); console.log(`fifa for ${match.id}: ${id}`); }
    }
    if (!match.bbc && bbcEps.length) {
      const id = bbcEpisodeId(bbcEps, hn, an);
      if (id) { match.bbc = id; console.log(`bbc for ${match.id}: ${id}`); }
    }
  }

  // 4) timesoccertv.com full-match replays + international highlights, embedded
  //    on our site with credit. Best-effort scrape for recently-played matches
  //    that don't have it yet (capped per run to stay polite).
  let tstvTried = 0;
  for (const match of byId.values()) {
    if (match.tstv || tstvTried >= TSTV_MAX_PER_RUN) continue;
    const ko = match.kickoff ? new Date(match.kickoff).getTime() : 0;
    if (!ko || ko > nowMs || ko < nowMs - TSTV_LOOKBACK_MS) continue;
    tstvTried++;
    const t = await fetchTstv(match);
    if (t) { match.tstv = t; console.log(`tstv for ${match.id}: ${t.page} full=${t.full?.length || 0} hl=${t.highlights ? 1 : 0}`); }
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
