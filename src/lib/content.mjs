import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Everything except archived content is public. Each claim carries a visible review level:
//   draft    (grey)   – researched and sourced, not yet reviewed by a person
//   internal (orange) – approved by the Vaivoo editor
//   external (green)  – approved by an independent reviewer outside Vaivoo
// PREVIEW_DRAFTS=1 only adds a banner; it no longer changes what is shown.
const PREVIEW = process.env.PREVIEW_DRAFTS === '1';
const root = path.resolve('content');
const visible = s => s !== 'archived';
const loadYaml = f => yaml.load(fs.readFileSync(f, 'utf8'), { schema: yaml.JSON_SCHEMA });
const listDir = d => (fs.existsSync(d) ? fs.readdirSync(d) : []);

export const SECTIONS = {
  Method: 'methods', DeploymentProfile: 'profiles', Authenticator: 'authenticators',
  Credential: 'credentials', Protocol: 'protocols', Standard: 'standards', Factor: 'factors',
  Signal: 'signals', Process: 'processes', IdentitySystem: 'identity-systems', Attack: 'attacks',
  Provider: 'providers', Product: 'products', UseCase: 'use-cases',
  CryptographicPrimitive: 'crypto', KeyProtection: 'key-protection', Regulation: 'regulations'
};
export const LABELS = {
  methods: 'Methods', profiles: 'Deployment profiles', authenticators: 'Authenticators', credentials: 'Credentials',
  protocols: 'Protocols', standards: 'Standards', factors: 'Factors', signals: 'Signals', processes: 'Processes',
  'identity-systems': 'Identity systems', attacks: 'Attacks', providers: 'Providers', products: 'Products',
  'use-cases': 'Use cases', crypto: 'Cryptography', 'key-protection': 'Key protection', regulations: 'Regulations'
};
export const VALUE_LABEL = { supported: 'Supported', not_supported: 'Not supported', conditional: 'Conditional', unknown: 'Unknown', not_applicable: 'N/A' };

export const REVIEW = {
  external: { label: 'Externally reviewed', short: 'External', cls: 'rv-external' },
  internal: { label: 'Internally reviewed', short: 'Internal', cls: 'rv-internal' },
  draft: { label: 'Draft · not yet reviewed', short: 'Draft', cls: 'rv-draft' },
  disputed: { label: 'Disputed · under review', short: 'Disputed', cls: 'rv-disputed' }
};
const HIDDEN_CLAIM = new Set(['rejected', 'superseded']);

export function reviewLevel(c) {
  if (c.status === 'approved') return c.review_level === 'external' ? 'external' : 'internal';
  if (c.status === 'disputed') return 'disputed';
  return 'draft';
}

let cache;
export function allEntities() {
  if (cache) return cache;
  const dir = path.join(root, 'entities');
  cache = listDir(dir).filter(f => /\.ya?ml$/.test(f))
    .map(f => loadYaml(path.join(dir, f)))
    .filter(e => visible(e.status))
    .map(e => ({ ...e, section: SECTIONS[e.type], url: `/${SECTIONS[e.type]}/${e.slug}/` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
export const byId = id => allEntities().find(e => e.id === id);

export const displayClaim = c => ({ ...c, shown: c.value, review: reviewLevel(c) });
export const publicClaims = entity => entity.claims.filter(c => !HIDDEN_CLAIM.has(c.status)).map(displayClaim);

export function claimById(id) {
  for (const e of allEntities()) {
    const c = e.claims.find(cl => cl.id === id);
    if (c && !HIDDEN_CLAIM.has(c.status)) return { entity: e, claim: displayClaim(c) };
  }
  return null;
}

// Counts per review level, and whether anything on the page has been approved by a person.
export function reviewSummary(claims) {
  const counts = { external: 0, internal: 0, draft: 0, disputed: 0 };
  for (const c of claims) counts[c.review ?? reviewLevel(c)]++;
  return { counts, total: claims.length, approved: counts.external + counts.internal };
}

export function allComparisons() {
  const dir = path.join(root, 'comparisons');
  return listDir(dir).filter(f => /\.ya?ml$/.test(f)).map(f => loadYaml(path.join(dir, f)))
    .filter(c => visible(c.status)).sort((a, b) => a.title.localeCompare(b.title));
}
export function comparisonCell(column, row) {
  for (const id of [column.entity, ...(column.fallback_entities || [])]) {
    const e = byId(id);
    const c = e?.claims.find(cl => row.predicates.includes(cl.predicate) && !HIDDEN_CLAIM.has(cl.status));
    if (c) return { entity: e, claim: displayClaim(c) };
  }
  return null;
}

// Dates are shown to readers as month + year ("Oct 2026"); the full date stays in the data and the JSON export.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function monthLabel(d) {
  const m = /^(\d{4})-(\d{2})/.exec(String(d ?? ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null;
}

export const isPreview = PREVIEW;
