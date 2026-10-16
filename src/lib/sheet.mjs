// Helpers for the downloadable datasheets (Direction C).
const CODES = {
  methods: 'METHOD', profiles: 'PROFILE', attacks: 'ATTACK', credentials: 'CRED', protocols: 'PROTO',
  standards: 'STD', crypto: 'CRYPTO', 'identity-systems': 'IDSYS', regulations: 'REG'
};
export const docId = e => `VA-${CODES[e.section] ?? e.section.toUpperCase()}-${e.slug.toUpperCase()}`;
export const cmpDocId = c => `VA-CMP-${c.id.replace(/^cmp-/, "").toUpperCase()}`;
export const rev = d => (d ? String(d).slice(0, 7) : '—');
export const sheetUrl = e => `/datasheet/${e.section}/${e.slug}/`;
export const cmpSheetUrl = c => `/datasheet/compare/${c.slug}/`;
export const num = (i, p = 'C') => `${p}-${String(i + 1).padStart(2, '0')}`;
export const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return u; } };
// Unique sources across claims, in first-seen order, with the claim numbers that cite them.
export function sources(claims) {
  const map = new Map();
  claims.forEach((c, i) => c.evidence.forEach(ev => {
    const k = ev.url;
    if (!map.has(k)) map.set(k, { ...ev, cited: [] });
    const s = map.get(k); if (!s.cited.includes(i)) s.cited.push(i);
  }));
  return [...map.values()];
}
