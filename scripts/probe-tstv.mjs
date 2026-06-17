// Throwaway probe: inspect timesoccertv.com structure so we can design the
// real integration. Prints HTTP status, iframe/embed URLs, detectable video
// hosts, and a sample of match links. Safe to delete after investigation.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const URLS = [
  'https://timesoccertv.com/full-matches-and-shows-highlights/',
  'https://timesoccertv.com/portugal-highlights/',
];

async function probe(url) {
  console.log('\n===== ' + url);
  let r;
  try {
    r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*', 'accept-language': 'en-US,en;q=0.9' }, redirect: 'follow' });
  } catch (e) { console.log('FETCH ERROR:', e.message); return; }
  console.log('status:', r.status, r.statusText, '-> final url:', r.url);
  console.log('content-type:', r.headers.get('content-type'));
  console.log('server:', r.headers.get('server'), '| cf-ray:', r.headers.get('cf-ray'));
  if (!r.ok) { console.log('body (first 400):', (await r.text()).slice(0, 400).replace(/\s+/g, ' ')); return; }
  const html = await r.text();
  console.log('html length:', html.length);

  const grab = (re, label, max = 12) => {
    const set = new Set();
    let m;
    while ((m = re.exec(html)) && set.size < max) set.add(m[1]);
    if (set.size) console.log(`\n-- ${label} (${set.size})`); for (const s of set) console.log('   ', s);
  };

  grab(/<iframe[^>]*\ssrc=["']([^"']+)["']/gi, 'iframe src');
  grab(/["'](https?:\/\/[^"']*(?:embed|player|stream)[^"']*)["']/gi, 'embed/player/stream urls');
  grab(/["'](https?:\/\/[^"']*\.(?:m3u8|mp4)[^"']*)["']/gi, 'media files');
  grab(/["'](https?:\/\/(?:ok\.ru|www\.dailymotion\.com|streamable\.com|streamja\.com|dood[^"']*|vk\.com)[^"']+)["']/gi, 'known video hosts');
  // Article/match links to understand per-match URL structure
  grab(/<a[^>]*\shref=["'](https:\/\/timesoccertv\.com\/[a-z0-9-]+\/?)["']/gi, 'internal links', 25);
  // Page <title> (does it leak scores?)
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  console.log('\npage <title>:', title?.[1]);
}

for (const u of URLS) await probe(u);
