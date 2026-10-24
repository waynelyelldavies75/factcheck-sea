// GET -> latest items from local fact-checkers (RSS). VERIFY each feed URL and its terms of use.
const FEEDS = [
  { name: 'TurnBackHoax (Mafindo)', country: 'ID', url: 'https://turnbackhoax.id/feed/' },
  { name: 'Sebenarnya.my', country: 'MY', url: 'https://sebenarnya.my/feed/' }
  // Add more: Singapore, Cekfakta, JomCheck, AFP Fact Check, etc.
];
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' };
const pick = (s, tag) => { const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };

exports.handler = async () => {
  const lists = await Promise.all(FEEDS.map(async f => {
    try {
      const r = await fetch(f.url, { signal: AbortSignal.timeout(8000) });
      const xml = await r.text();
      return (xml.match(/<item[\s\S]*?<\/item>/g) || []).slice(0, 10).map(it => ({
        title: pick(it, 'title').replace(/<[^>]+>/g, ''), url: pick(it, 'link'),
        date: pick(it, 'pubDate'), publisher: f.name, country: f.country
      }));
    } catch { return []; }
  }));
  const items = lists.flat().filter(i => i.title && i.url).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ items }) };
};
