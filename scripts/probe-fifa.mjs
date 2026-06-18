// Throwaway probe: why does fifaWatchId find nothing for some matches?
// Replicates the search + checks from update-highlights.mjs with verbose output.
// Safe to delete after investigation.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const OLD_EDITION = /\b(2002|2006|2010|2014|2018|2022)\b|russia 2018|qatar 2022|brazil 2014|south africa 2010/i;
const WATCH_URL = /fifa\.com\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/i;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const matchNorm = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
const containsName = (h, n) => {
  const H = matchNorm(h), k = matchNorm(n);
  return k.length > 0 && new RegExp(`(?:^| )${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: |$)`).test(H);
};

async function searchResults(query) {
  const { SERPAPI_KEY, GOOGLE_CSE_KEY, GOOGLE_CSE_CX, BRAVE_API_KEY } = process.env;
  console.log(`  provider: ${SERPAPI_KEY ? 'serpapi' : GOOGLE_CSE_KEY ? 'google' : BRAVE_API_KEY ? 'brave' : 'NONE'}`);
  try {
    if (SERPAPI_KEY) {
      const u = 'https://serpapi.com/search.json?engine=google&num=10&q=' + encodeURIComponent(query) + '&api_key=' + SERPAPI_KEY;
      const r = await fetch(u); if (!r.ok) { console.log('  serpapi', r.status); return []; }
      const j = await r.json(); return (j.organic_results || []).map((x) => ({ url: x.link, text: `${x.title || ''} ${x.snippet || ''}` })).filter((x) => x.url);
    }
    if (GOOGLE_CSE_KEY && GOOGLE_CSE_CX) {
      const u = 'https://www.googleapis.com/customsearch/v1?num=10&key=' + GOOGLE_CSE_KEY + '&cx=' + GOOGLE_CSE_CX + '&q=' + encodeURIComponent(query);
      const r = await fetch(u); if (!r.ok) { console.log('  google', r.status); return []; }
      const j = await r.json(); return (j.items || []).map((x) => ({ url: x.link, text: `${x.title || ''} ${x.snippet || ''}` })).filter((x) => x.url);
    }
    if (BRAVE_API_KEY) {
      const u = 'https://api.search.brave.com/res/v1/web/search?count=20&q=' + encodeURIComponent(query);
      const r = await fetch(u, { headers: { 'X-Subscription-Token': BRAVE_API_KEY, Accept: 'application/json' } });
      if (!r.ok) { console.log('  brave', r.status, (await r.text()).slice(0, 120)); return []; }
      const j = await r.json(); return (j.web?.results || []).map((x) => ({ url: x.url, text: `${x.title || ''} ${x.description || ''}` })).filter((x) => x.url);
    }
  } catch (e) { console.log('  search err', e.message); }
  return [];
}

async function probeQuery(home, away) {
  const q = `${home} vs ${away} highlights FIFA World Cup 2026 watch site:fifa.com`;
  console.log(`\n===== ${home} vs ${away}\n  q: ${q}`);
  const results = await searchResults(q);
  console.log(`  results: ${results.length}`);
  for (const { url, text } of results.slice(0, 10)) {
    const watch = String(url).match(WATCH_URL);
    const old = OLD_EDITION.test(text);
    const mh = containsName(text, home), ma = containsName(text, away);
    console.log(`   ${watch ? 'WATCH:' + watch[1] : 'no-watch'} | old=${old} home=${mh} away=${ma} | ${url}`);
    console.log(`       text: ${text.slice(0, 130)}`);
  }
}

// Try fetching the highlights hub to see if watch links are in static HTML.
async function probeHub() {
  const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/highlights';
  console.log('\n===== HUB ' + url);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    console.log('  status', r.status, '| server', r.headers.get('server'));
    if (!r.ok) return;
    const html = await r.text();
    console.log('  html length', html.length);
    const watches = [...html.matchAll(WATCH_URL)].map((m) => m[1]);
    console.log('  watch ids in HTML:', [...new Set(watches)].slice(0, 20));
    for (const t of ['Ghana', 'Panama', 'Uzbekistan', 'Colombia']) console.log(`  mentions ${t}:`, html.toLowerCase().includes(t.toLowerCase()));
  } catch (e) { console.log('  hub err', e.message); }
}

await probeQuery('Ghana', 'Panama');
await probeQuery('Uzbekistan', 'Colombia');
await probeQuery('Portugal', 'DR Congo'); // control: this one was found
await probeHub();
