// POST {claim, lang} -> {verdict, summary, sources[]}
// Only ONE env var needed: ANTHROPIC_API_KEY (optional: CLAUDE_MODEL). No Google key.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
const LANGS = { en: 'English', ms: 'Bahasa Malaysia', id: 'Bahasa Indonesia', zh: 'Simplified Chinese' };
const reply = (code, body) => ({ statusCode: code, headers: CORS, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(204, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
  let claim, lang;
  try { ({ claim, lang } = JSON.parse(event.body || '{}')); } catch { return reply(400, { error: 'bad json' }); }
  claim = String(claim || '').trim().slice(0, 1500);
  if (claim.length < 8) return reply(400, { error: 'claim too short' });
  lang = LANGS[lang] ? lang : 'en';

  const system = `You help people in Singapore, Malaysia and Indonesia check viral claims. Search the web for existing fact-checks of the claim from established fact-checkers (for example Mafindo/TurnBackHoax, Cekfakta, Sebenarnya.my, JomCheck, Factually, AFP, Reuters, BBC Verify). Base your verdict ONLY on what those sources say; never add facts of your own. If no fact-checker or reliable source addresses the claim, verdict is UNVERIFIED and say the reader should be cautious. Do not give political opinions. Reply in ${LANGS[lang]}. Finish with ONLY this JSON: {"verdict":"TRUE|FALSE|MISLEADING|PARTIAL|UNVERIFIED","summary":"max 3 short sentences"}`;
  try {
    const a = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5', max_tokens: 1000, system,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
        messages: [{ role: 'user', content: `CLAIM:\n${claim}` }]
      }),
      signal: AbortSignal.timeout(25000)
    });
    const aj = await a.json();
    if (!a.ok) return reply(502, { error: aj.error?.message || 'upstream failed' });
    const blocks = aj.content || [];
    const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    let out; try { out = JSON.parse(m ? m[0] : ''); } catch { out = { verdict: 'UNVERIFIED', summary: text.slice(0, 300) }; }
    const seen = new Set(), sources = [];
    for (const b of blocks) if (b.type === 'web_search_tool_result' && Array.isArray(b.content))
      for (const r of b.content) if (r.url && !seen.has(r.url)) { seen.add(r.url); sources.push({ publisher: (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return ''; } })(), title: r.title || r.url, url: r.url, rating: '' }); }
    return reply(200, { verdict: out.verdict, summary: out.summary, sources: sources.slice(0, 6) });
  } catch (e) {
    return reply(502, { error: 'upstream failed' });
  }
};
