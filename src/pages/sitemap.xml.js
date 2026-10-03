import { allEntities, allComparisons, publicClaims, comparisonCell, claimById, reviewSummary } from '../lib/content.mjs';
// Only pages with at least one human-reviewed claim are listed; draft-only pages carry noindex.
const SITE = 'https://vaivoo.com';
export function GET() {
  const reviewed = claims => reviewSummary(claims).approved > 0;
  const guides = Object.values(import.meta.glob('../../content/guides/*.md', { eager: true }))
    .filter(m => m.frontmatter.status !== 'archived')
    .filter(m => reviewed([...m.rawContent().matchAll(/#(claim-[a-z0-9-]+)\)/g)].map(x => claimById(x[1])).filter(Boolean).map(x => x.claim)));
  const urls = [
    '/', '/methodology/', '/about/', '/corrections/', '/privacy/', '/compare/', '/guides/',
    ...allEntities().filter(e => reviewed(publicClaims(e))).map(e => e.url),
    ...allComparisons().filter(c => reviewed(c.rows.flatMap(r => c.columns.map(col => comparisonCell(col, r))).filter(Boolean).map(x => x.claim))).map(c => `/compare/${c.slug}/`),
    ...guides.map(m => `/guides/${m.frontmatter.slug}/`)
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
