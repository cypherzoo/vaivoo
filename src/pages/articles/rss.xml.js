import { loadArticles } from '../../lib/articles.mjs';
const SITE = 'https://vaivoo.com';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function GET() {
  const items = loadArticles(import.meta.glob('../../../content/articles/*.md', { eager: true })).slice(0, 50);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>The Vaivoo Project · Articles</title>
<link>${SITE}/articles/</link>
<atom:link href="${SITE}/articles/rss.xml" rel="self" type="application/rss+xml"/>
<description>Authentication and identity security: breaches, vulnerabilities, standards, research and discussion.</description>
<language>en</language>
${items.map(a => `<item><title>${esc(a.title)}</title><link>${SITE}${a.url}</link><guid>${SITE}${a.url}</guid><pubDate>${new Date(a.date + 'T08:00:00Z').toUTCString()}</pubDate><category>${esc(a.category)}</category><dc:creator>${esc(a.author)}</dc:creator><description>${esc(a.summary)}</description></item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
