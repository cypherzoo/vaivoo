// Articles: news and analysis on authentication and identity security. Loaded via Vite glob in pages.
export const CATEGORIES = ['Breach', 'Vulnerability', 'Standard', 'Research', 'Invention', 'Discussion', 'News'];
export function loadArticles(mods) {
  return Object.values(mods)
    .map(m => ({ ...m.frontmatter, Content: m.Content, raw: m.rawContent() }))
    .filter(a => a.status === 'published')
    .map(a => ({ ...a, url: `/articles/${a.slug}/`, minutes: Math.max(1, Math.round(a.raw.split(/\s+/).length / 220)) }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
export const dayLabel = d => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d ?? ''));
  if (!m) return '';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${MON[Number(m[2]) - 1]} ${m[1]}`;
};
