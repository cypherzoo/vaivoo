import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Public build shows only status: published. Set PREVIEW_DRAFTS=1 locally to see drafts.
const PREVIEW = process.env.PREVIEW_DRAFTS === '1';
const dir = path.resolve('content/entities');

export const SECTIONS = {
  Method: 'methods', DeploymentProfile: 'profiles', Authenticator: 'authenticators',
  Credential: 'credentials', Protocol: 'protocols', Standard: 'standards', Factor: 'factors',
  Signal: 'signals', Process: 'processes', IdentitySystem: 'identity-systems', Attack: 'attacks',
  Provider: 'providers', Product: 'products', UseCase: 'use-cases',
  CryptographicPrimitive: 'crypto', KeyProtection: 'key-protection', Regulation: 'regulations'
};
export const LABELS = Object.fromEntries(Object.entries(SECTIONS).map(([t, s]) => [s, t.replace(/([a-z])([A-Z])/g, '$1 $2')]));

let cache;
export function allEntities() {
  if (cache) return cache;
  cache = fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f))
    .map(f => yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'), { schema: yaml.JSON_SCHEMA }))
    .filter(e => e.status === 'published' || (PREVIEW && e.status !== 'archived'))
    .map(e => ({ ...e, section: SECTIONS[e.type], url: `/${SECTIONS[e.type]}/${e.slug}/` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
export const byId = id => allEntities().find(e => e.id === id);

// Only approved claims are stated as fact. Everything else renders as "not yet verified".
export function publicClaims(entity) {
  return entity.claims.map(c => c.status === 'approved' ? c : { ...c, value: 'unknown', unverified: true });
}
export const isPreview = PREVIEW;
