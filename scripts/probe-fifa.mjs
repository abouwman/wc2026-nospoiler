// Throwaway probe: why does fifaWatchId find nothing for Czechia v South Africa?
const WATCH_URL = /fifa\.com\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/i;
const OLD_EDITION = /\b(2002|2006|2010|2014|2018|2022)\b/i;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const matchNorm = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function pairTitle(text, homeNames, awayNames) {
  const t = matchNorm(text);
  for (const [a, b] of [[homeNames, awayNames], [awayNames, homeNames]])
    for (const x of a) for (const y of b) {
      const X = matchNorm(x), Y = matchNorm(y); if (!X || !Y) continue;
      if (new RegExp(`^${esc(X)} (?:v|vs) ${esc(Y)}(?: |$)`).test(t)) return true;
    }
  return false;
}
async function search(q) {
  const u = 'https://api.search.brave.com/res/v1/web/search?count=20&q=' + encodeURIComponent(q);
  const r = await fetch(u, { headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY, Accept: 'application/json' } });
  if (!r.ok) { console.log('  brave', r.status, (await r.text()).slice(0, 150)); return []; }
  const j = await r.json();
  return (j.web?.results || []).map((x) => ({ url: x.url, text: `${x.title || ''} ${x.description || ''}` })).filter((x) => x.url);
}

const home = ['czechia', 'czech republic'], away = ['south africa'];
const queries = [
  `czechia v south africa highlights site:fifa.com/en/watch`,
  `czechia v south africa Group highlights FIFA World Cup 2026 site:fifa.com`,
  `czechia vs south africa highlights FIFA World Cup 2026 watch site:fifa.com`,
];
for (const q of queries) {
  console.log('\n==== q:', q);
  const res = await search(q);
  console.log('  results', res.length);
  for (const { url, text } of res.slice(0, 12)) {
    const w = String(url).match(WATCH_URL);
    console.log(`   ${w ? 'WATCH:' + w[1] : 'no-watch'} pair=${pairTitle(text, home, away)} old=${OLD_EDITION.test(text)} | ${url}`);
    if (w) console.log(`       text: ${text.slice(0, 140)}`);
  }
}
