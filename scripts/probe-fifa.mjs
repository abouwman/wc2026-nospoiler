// Throwaway probe: does a FIFA article/match-centre page contain the /watch/ id?
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const WATCH_URL = /fifa\.com\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/gi;
const WATCH_PATH = /\/(?:fifaplus\/)?en\/watch\/([A-Za-z0-9_-]{16,26})/gi;

const urls = [
  'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/czechia-south-africa-highlights-match-report',
  'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/czechia-south-africa-live-stream-team-news-tickets',
  'https://www.fifa.com/en/match-centre/match/17/285023/289273/400021440',
];

for (const url of urls) {
  console.log('\n==== ' + url);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    console.log('  status', r.status, '| ctype', r.headers.get('content-type'));
    if (!r.ok) continue;
    const html = await r.text();
    console.log('  html length', html.length);
    const ids = [...new Set([...html.matchAll(WATCH_URL)].map((m) => m[1]).concat([...html.matchAll(WATCH_PATH)].map((m) => m[1])))];
    console.log('  watch ids found:', ids.slice(0, 10));
    console.log('  has __NEXT_DATA__:', html.includes('__NEXT_DATA__'), '| has "videoId":', /["']videoId["']/.test(html), '| has "entryId":', /entryId/.test(html));
    // any kaltura/entry style ids near "watch"
    const near = html.match(/watch[^]{0,120}/i);
    if (near) console.log('  near-watch snippet:', near[0].replace(/\s+/g, ' ').slice(0, 140));
  } catch (e) { console.log('  err', e.message); }
}
