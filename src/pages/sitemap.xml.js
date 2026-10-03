import { allEntities, allComparisons, isPreview } from '../lib/content.mjs';
// Public pages only. Drafts never appear (and a preview build gets no sitemap entries beyond static pages).
const SITE = 'https://vaivoo.com';
export function GET() {
  const guides = Object.values(import.meta.glob('../../content/guides/*.md', { eager: true }))
    .map(m => m.frontmatter).filter(f => f.status === 'published');
  const live = x => !isPreview && x.status === 'published';
  const urls = [
    '/', '/methodology/', '/about/', '/corrections/', '/privacy/', '/compare/', '/guides/',
    ...allEntities().filter(live).map(e => e.url),
    ...allComparisons().filter(live).map(c => `/compare/${c.slug}/`),
    ...(isPreview ? [] : guides.map(g => `/guides/${g.slug}/`))
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
