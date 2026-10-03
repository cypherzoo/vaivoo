import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Public build shows only status: published. Set PREVIEW_DRAFTS=1 locally to see drafts.
const PREVIEW = process.env.PREVIEW_DRAFTS === '1';
const root = path.resolve('content');
const visible = s => s === 'published' || (PREVIEW && s !== 'archived');
const loadYaml = f => yaml.load(fs.readFileSync(f, 'utf8'), { schema: yaml.JSON_SCHEMA });
const listDir = d => (fs.existsSync(d) ? fs.readdirSync(d) : []);

export const SECTIONS = {
  Method: 'methods', DeploymentProfile: 'profiles', Authenticator: 'authenticators',
  Credential: 'credentials', Protocol: 'protocols', Standard: 'standards', Factor: 'factors',
  Signal: 'signals', Process: 'processes', IdentitySystem: 'identity-systems', Attack: 'attacks',
  Provider: 'providers', Product: 'products', UseCase: 'use-cases',
  CryptographicPrimitive: 'crypto', KeyProtection: 'key-protection', Regulation: 'regulations'
};
export const LABELS = Object.fromEntries(Object.entries(SECTIONS).map(([t, s]) => [s, t.replace(/([a-z])([A-Z])/g, '$1 $2')]));
export const VALUE_LABEL = { supported: 'Supported', not_supported: 'Not supported', conditional: 'Conditional', unknown: 'Unknown', not_applicable: 'N/A' };

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

// Only approved claims are stated as fact on the public site. In preview builds the proposed
// value is shown with an "unverified" marker so reviewers can see what they are approving.
export function displayClaim(c) {
  if (c.status === 'approved') return { ...c, shown: c.value, unverified: false };
  return { ...c, shown: PREVIEW ? c.value : 'unknown', unverified: true };
}
export const publicClaims = entity => entity.claims.map(displayClaim);

// Comparisons: rows are claim predicates; cells are looked up in the column's entity, then in its fallbacks.
export function allComparisons() {
  const dir = path.join(root, 'comparisons');
  return listDir(dir).filter(f => /\.ya?ml$/.test(f)).map(f => loadYaml(path.join(dir, f)))
    .filter(c => visible(c.status)).sort((a, b) => a.title.localeCompare(b.title));
}
export function comparisonCell(column, row) {
  for (const id of [column.entity, ...(column.fallback_entities || [])]) {
    const e = byId(id);
    const c = e?.claims.find(cl => row.predicates.includes(cl.predicate));
    if (c) return { entity: e, claim: displayClaim(c) };
  }
  return null;
}

export const isPreview = PREVIEW;
