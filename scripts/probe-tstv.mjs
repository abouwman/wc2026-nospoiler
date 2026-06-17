// Throwaway probe v2: for a team article page, dump each iframe together with
// the nearby heading/label text so we can tell "full match" vs "highlights",
// and check whether the opponent is named (to confirm match identity).

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const URLS = [
  'https://timesoccertv.com/portugal-highlights/',
  'https://timesoccertv.com/new-zealand-full-match/',
];

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

async function probe(url) {
  console.log('\n===== ' + url);
  let html;
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    console.log('status', r.status);
    if (!r.ok) return;
    html = await r.text();
  } catch (e) { console.log('ERR', e.message); return; }

  // Each iframe with ~350 chars of preceding context (headings/tab labels).
  const re = /<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const before = strip(html.slice(Math.max(0, m.index - 600), m.index)).slice(-220);
    console.log('\nIFRAME', m[1]);
    console.log('  ctx-before:', before);
  }

  // Opponent / score check: look for "vs" patterns and any digit-dash-digit score.
  const vs = [...html.matchAll(/([A-Z][a-zA-Z .]+?)\s+(?:vs\.?|v)\s+([A-Z][a-zA-Z .]+?)[\s<|]/g)].slice(0, 6).map((x) => `${x[1].trim()} v ${x[2].trim()}`);
  console.log('\n  "vs" phrases:', [...new Set(vs)]);
  const scores = [...html.matchAll(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/g)].slice(0, 8).map((x) => x[0]);
  console.log('  score-like tokens (spoiler check):', [...new Set(scores)]);
  // Tab/section labels that may distinguish full vs highlights
  const labels = [...html.matchAll(/<(?:h[1-4]|button|a|span)[^>]*>([^<]{0,40}(?:full match|extended highlights|highlights|replay)[^<]{0,40})<\//gi)].slice(0, 12).map((x) => strip(x[1]));
  console.log('  full/highlights labels:', [...new Set(labels)]);
}

for (const u of URLS) await probe(u);
