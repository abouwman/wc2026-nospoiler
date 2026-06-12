// World Cup No Spoiler — sample tournament data + schedule generator
// NOTE: groups/fixtures are SAMPLE data (plausible, not the real 2026 draw).
(function () {
  const WC = {};

  // --- Teams (48) -----------------------------------------------------------
  // colors: [panel base, diagonal slash] — drawn from each flag/kit
  WC.TEAMS = {
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

  WC.GROUP_LETTERS = 'ABCDEFGHIJKL'.split('');
  WC.GROUPS = {
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

  WC.VENUES = [
    'Estadio Azteca · Mexico City', 'Estadio BBVA · Monterrey', 'Estadio Akron · Guadalajara',
    'BMO Field · Toronto', 'BC Place · Vancouver', 'MetLife Stadium · New York NJ',
    'SoFi Stadium · Los Angeles', 'AT&T Stadium · Dallas', 'NRG Stadium · Houston',
    'Arrowhead Stadium · Kansas City', 'Mercedes-Benz Stadium · Atlanta', 'Hard Rock Stadium · Miami',
    'Lincoln Financial Field · Philadelphia', "Levi's Stadium · SF Bay Area",
    'Lumen Field · Seattle', 'Gillette Stadium · Boston',
  ];

  const TIMES = ['12:00', '15:00', '18:00', '21:00'];

  // --- Commentary sources ---------------------------------------------------
  WC.LANGS = {
    en: { label: 'EN', name: 'English', source: 'ESPN · YouTube', short: 'ESPN' },
    es: { label: 'ES', name: 'Español', source: 'Telemundo · YouTube', short: 'Telemundo' },
    nl: { label: 'NL', name: 'Nederlands', source: 'NOS · nos.nl', short: 'NOS' },
  };
  WC.LANG_ORDER = ['en', 'es', 'nl'];

  // Stand-in embeddable videos (Blender open movies) — swap for real highlight
  // URLs per source in production.
  WC.VIDEO_POOL = ['aqz-KE-bpKQ', 'eRsGyueVLvQ', 'R6MlUcmOul8', 'WhWc3b3KhnY', 'SkVqJ1SGeL0'];

  // --- Helpers ---------------------------------------------------------------
  WC.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  };

  // dayIdx 0 = June 10, 2026. Tournament: Jun 11 (1) → Jul 19 (39).
  WC.DAY0 = Date.UTC(2026, 5, 10);
  WC.dateOf = (dayIdx) => new Date(WC.DAY0 + dayIdx * 86400000);
  WC.fmtDay = function (dayIdx) {
    const d = WC.dateOf(dayIdx);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  };
  WC.fmtDayShort = function (dayIdx) {
    const d = WC.dateOf(dayIdx);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  WC.STAGE_LABELS = {
    group: 'Group stage', r32: 'Round of 32', r16: 'Round of 16',
    qf: 'Quarter-final', sf: 'Semi-final', third: 'Third place', final: 'Final',
  };

  WC.videoFor = function (matchId, lang) {
    return WC.VIDEO_POOL[WC.hash(matchId + ':' + lang) % WC.VIDEO_POOL.length];
  };

  function langsFor(id, home, away) {
    const langs = ['en', 'es'];
    if (home === 'NED' || away === 'NED' || WC.hash(id + ':nl') % 3 === 0) langs.push('nl');
    return langs;
  }

  // --- Schedule generator ----------------------------------------------------
  // simDay: dayIdx of "today". A match is `played` if its dayIdx < simDay,
  // `today` if equal, else `upcoming`.
  WC.build = function (simDay) {
    const matches = [];
    let num = 0;

    function push(m) {
      num += 1;
      const id = 'm' + num;
      const status = m.dayIdx < simDay ? 'played' : (m.dayIdx === simDay ? 'today' : 'upcoming');
      const venue = WC.VENUES[WC.hash(id + ':v') % WC.VENUES.length];
      const time = TIMES[WC.hash(id + ':t') % TIMES.length];
      const langs = m.home && m.away ? langsFor(id, m.home, m.away) : ['en', 'es'];
      matches.push(Object.assign({ id, num, venue, time, status, langs, played: status === 'played' }, m));
      return matches[matches.length - 1];
    }

    // Group stage — MD1 Jun 11–14, MD2 Jun 16–19, MD3 Jun 21–26
    const rounds = [
      { pairs: [[0, 1], [2, 3]], day: (g) => 1 + Math.floor(g / 3) },
      { pairs: [[0, 2], [1, 3]], day: (g) => 6 + Math.floor(g / 3) },
      { pairs: [[0, 3], [1, 2]], day: (g) => 11 + Math.floor(g / 2) },
    ];
    rounds.forEach((round) => {
      WC.GROUP_LETTERS.forEach((letter, g) => {
        const teams = WC.GROUPS[letter];
        round.pairs.forEach((p) => {
          push({ stage: 'group', group: letter, dayIdx: round.day(g), home: teams[p[0]], away: teams[p[1]] });
        });
      });
    });

    // Sample standings: deterministic shuffle of each group by hash
    const standings = {};
    WC.GROUP_LETTERS.forEach((letter) => {
      standings[letter] = WC.GROUPS[letter].slice().sort((a, b) => WC.hash('st:' + a) - WC.hash('st:' + b));
    });
    const W = WC.GROUP_LETTERS.map((l) => ({ team: standings[l][0], label: 'Winner Grp ' + l }));
    const R = WC.GROUP_LETTERS.map((l) => ({ team: standings[l][1], label: 'Runner-up Grp ' + l }));
    const T = WC.GROUP_LETTERS.slice(0, 8).map((l) => ({ team: standings[l][2], label: '3rd place Grp ' + l }));

    // Round of 32 pairings (sample bracket) — Jun 28 → Jul 1, 4/day
    const r32Pairs = [];
    for (let g = 0; g < 8; g++) r32Pairs.push([W[g], T[(g + 3) % 8]]);
    for (let g = 8; g < 12; g++) r32Pairs.push([W[g], R[g - 8]]);
    for (let g = 4; g < 8; g++) r32Pairs.push([R[g], R[g + 4]]);

    function pushKO(stage, i, dayIdx, feedHome, feedAway) {
      const groupDone = simDay > 16; // all group matches finish dayIdx 16
      const resolveSide = (feed) => {
        if (feed.team) return { code: groupDone ? feed.team : null, label: feed.label };
        const fm = feed.match;
        if (fm.played) {
          const winner = WC.hash(fm.id + ':w') % 2 === 0 ? fm.home : fm.away;
          return { code: winner, label: 'Winner Match ' + fm.num };
        }
        return { code: null, label: 'Winner Match ' + fm.num };
      };
      const h = resolveSide(feedHome), a = resolveSide(feedAway);
      return push({
        stage, dayIdx,
        home: h.code, away: a.code,
        homeLabel: h.label, awayLabel: a.label,
      });
    }

    const r32 = r32Pairs.map((pair, i) => pushKO('r32', i, 18 + Math.floor(i / 4), pair[0], pair[1]));
    const r16 = [];
    for (let i = 0; i < 8; i++) r16.push(pushKO('r16', i, 24 + Math.floor(i / 2), { match: r32[i * 2] }, { match: r32[i * 2 + 1] }));
    const qf = [];
    for (let i = 0; i < 4; i++) qf.push(pushKO('qf', i, 29 + Math.floor(i / 2), { match: r16[i * 2] }, { match: r16[i * 2 + 1] }));
    const sf = [];
    for (let i = 0; i < 2; i++) sf.push(pushKO('sf', i, 34 + i, { match: qf[i * 2] }, { match: qf[i * 2 + 1] }));
    // Third place: losers of SFs — labels only unless SFs played
    const loserFeed = (fm) => {
      if (fm.played) {
        const winner = WC.hash(fm.id + ':w') % 2 === 0 ? fm.home : fm.away;
        return { team: fm.home === winner ? fm.away : fm.home, label: 'Loser Match ' + fm.num };
      }
      return { match: null, team: null, label: 'Loser Match ' + fm.num, unresolved: true };
    };
    const lf1 = loserFeed(sf[0]), lf2 = loserFeed(sf[1]);
    push({
      stage: 'third', dayIdx: 38,
      home: lf1.team && simDay > 16 ? lf1.team : null, away: lf2.team && simDay > 16 ? lf2.team : null,
      homeLabel: lf1.label, awayLabel: lf2.label,
    });
    pushKO('final', 0, 39, { match: sf[0] }, { match: sf[1] });

    return matches;
  };

  // --- YouTube IFrame API loader ---------------------------------------------
  WC.loadYT = function (cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    window.__ytQueue = window.__ytQueue || [];
    window.__ytQueue.push(cb);
    if (!window.__ytLoading) {
      window.__ytLoading = true;
      window.onYouTubeIframeAPIReady = function () {
        (window.__ytQueue || []).forEach((f) => { try { f(); } catch (e) { console.error(e); } });
        window.__ytQueue = [];
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  };

  window.WC = WC;
})();
