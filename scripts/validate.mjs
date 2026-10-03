// Validates every entity YAML against the schema plus editorial gates.
// Exit code 1 blocks the PR / deploy.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schema/entity.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const check = ajv.compile(schema);

const dir = path.join(root, 'content/entities');
const files = fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f));
const errors = [];
const entities = [];

for (const f of files) {
  let doc;
  try { doc = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'), { schema: yaml.JSON_SCHEMA }); }
  catch (e) { errors.push(`${f}: YAML parse error: ${e.message}`); continue; }
  if (!check(doc)) { for (const e of check.errors) errors.push(`${f}: ${e.instancePath || '/'} ${e.message}`); continue; }
  if (path.basename(f).replace(/\.ya?ml$/, '') !== doc.id) errors.push(`${f}: filename must equal id (${doc.id})`);
  entities.push({ f, doc });
}

// Uniqueness: ids, type+slug, names/aliases (rule 1: search aliases before adding)
const ids = new Map(), slugs = new Map(), names = new Map(), claimIds = new Map();
for (const { f, doc } of entities) {
  const dup = (map, key, label) => { if (map.has(key)) errors.push(`${f}: duplicate ${label} "${key}" (also in ${map.get(key)})`); else map.set(key, f); };
  dup(ids, doc.id, 'id');
  dup(slugs, `${doc.type}/${doc.slug}`, 'slug');
  for (const n of [doc.name, ...(doc.aliases || [])]) dup(names, n.toLowerCase(), 'name/alias');
  for (const c of doc.claims) dup(claimIds, c.id, 'claim id');
}

// Referential integrity + editorial gates
for (const { f, doc } of entities) {
  const own = new Set(doc.claims.map(c => c.id));
  for (const r of doc.relations || []) {
    if (!ids.has(r.object_id)) errors.push(`${f}: relation ${r.predicate} → unknown entity "${r.object_id}"`);
    if (r.claim_id && !own.has(r.claim_id)) errors.push(`${f}: relation references unknown claim "${r.claim_id}"`);
  }
  for (const c of doc.claims) {
    if (c.status !== 'approved' && c.review_level) errors.push(`${f}: ${c.id} has review_level but is not approved`);
    if (c.status === 'approved') {
      // An approved "unknown" records that sources do not settle the question, so contextual evidence is enough.
      if (c.value === 'unknown' ? c.evidence.length === 0 : !c.evidence.some(e => e.stance === 'supports')) errors.push(`${f}: ${c.id} approved without ${c.value === 'unknown' ? 'any' : 'supporting'} evidence`);
      if (!c.reviewed_by?.length || !c.reviewed_at) errors.push(`${f}: ${c.id} approved without reviewer/date`);
      if (!c.review_level) errors.push(`${f}: ${c.id} approved without review_level (internal | external)`);
      if (c.review_level === 'external') {
        const outside = (c.reviewed_by || []).filter(r => r !== doc.owner);
        if (outside.length === 0) errors.push(`${f}: ${c.id} external review needs a reviewer other than the owner`);
        if (c.review_tier === 'C' && (c.reviewed_by?.length ?? 0) < 2) errors.push(`${f}: ${c.id} Tier C external review needs owner + independent technical reviewer`);
      }
      if (c.value === 'conditional' && c.assumptions.length === 0) errors.push(`${f}: ${c.id} conditional value without stated conditions`);
    }
  }
  if (doc.status === 'published') {
    if (!doc.last_verified_at) errors.push(`${f}: published without last_verified_at`);
    if (!doc.next_review_at) errors.push(`${f}: published without next_review_at`);
    for (const r of doc.relations || []) {
      const target = entities.find(e => e.doc.id === r.object_id);
      if (target && target.doc.status !== 'published') console.warn(`warn ${f}: links to unpublished "${r.object_id}" (link will be hidden)`);
    }
  }
}

// ---------- Comparisons: cells come only from existing entity claims ----------
const SECTION = { Method: 'methods', DeploymentProfile: 'profiles', Authenticator: 'authenticators', Credential: 'credentials', Protocol: 'protocols', Standard: 'standards', Factor: 'factors', Signal: 'signals', Process: 'processes', IdentitySystem: 'identity-systems', Attack: 'attacks', Provider: 'providers', Product: 'products', UseCase: 'use-cases', CryptographicPrimitive: 'crypto', KeyProtection: 'key-protection', Regulation: 'regulations' };
const byIdDoc = new Map(entities.map(e => [e.doc.id, e.doc]));
const claimOwner = new Map(entities.flatMap(e => e.doc.claims.map(c => [c.id, { entity: e.doc, claim: c }])));
const cmpDir = path.join(root, 'content/comparisons');
const cmpFiles = fs.existsSync(cmpDir) ? fs.readdirSync(cmpDir).filter(f => /\.ya?ml$/.test(f)) : [];
const slugs2 = new Set();
for (const f of cmpFiles) {
  let c; try { c = yaml.load(fs.readFileSync(path.join(cmpDir, f), 'utf8'), { schema: yaml.JSON_SCHEMA }); } catch (e) { errors.push(`comparisons/${f}: YAML parse error: ${e.message}`); continue; }
  for (const k of ['id', 'slug', 'title', 'summary', 'status', 'columns', 'rows']) if (!c?.[k]) errors.push(`comparisons/${f}: missing ${k}`);
  if (!c?.columns || !c?.rows) continue;
  if (!['draft', 'in_review', 'published', 'archived'].includes(c.status)) errors.push(`comparisons/${f}: bad status ${c.status}`);
  if (slugs2.has(c.slug)) errors.push(`comparisons/${f}: duplicate slug ${c.slug}`); slugs2.add(c.slug);
  const colIds = c.columns.flatMap(col => [col.entity, ...(col.fallback_entities || [])]);
  for (const id of colIds) if (!byIdDoc.has(id)) errors.push(`comparisons/${f}: unknown entity "${id}"`);
  for (const row of c.rows) {
    if (!row.label || !Array.isArray(row.predicates) || !row.predicates.length) { errors.push(`comparisons/${f}: row needs label and predicates`); continue; }
    const hit = colIds.some(id => byIdDoc.get(id)?.claims.some(cl => row.predicates.includes(cl.predicate)));
    if (!hit) errors.push(`comparisons/${f}: row "${row.label}" matches no claim in any column`);
    for (const cid of Object.keys(row.labels || {})) {
      const own = claimOwner.get(cid);
      if (!own || !colIds.includes(own.entity.id) || !row.predicates.includes(own.claim.predicate)) errors.push(`comparisons/${f}: row "${row.label}" label for ${cid} does not match a claim in this row`);
    }
  }
  if (c.status === 'published') for (const id of colIds) if (byIdDoc.get(id)?.status !== 'published') errors.push(`comparisons/${f}: published but entity "${id}" is not published`);
}

// ---------- Guides: every inline claim link must resolve to the right entity page ----------
const guideDir = path.join(root, 'content/guides');
const guideFiles = fs.existsSync(guideDir) ? fs.readdirSync(guideDir).filter(f => f.endsWith('.md')) : [];
let guideClaims = 0;
for (const f of guideFiles) {
  const src = fs.readFileSync(path.join(guideDir, f), 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { errors.push(`guides/${f}: missing front matter`); continue; }
  let fm; try { fm = yaml.load(m[1], { schema: yaml.JSON_SCHEMA }); } catch (e) { errors.push(`guides/${f}: front matter error: ${e.message}`); continue; }
  for (const k of ['title', 'slug', 'summary', 'status']) if (!fm?.[k]) errors.push(`guides/${f}: missing ${k}`);
  if (fm?.slug && path.basename(f, '.md') !== fm.slug) errors.push(`guides/${f}: filename must equal slug`);
  const links = [...m[2].matchAll(/\]\(\/([a-z-]+)\/([a-z0-9-]+)\/#(claim-[a-z0-9-]+)\)/g)];
  if (!links.length) errors.push(`guides/${f}: no claim citations`);
  for (const [, section, slug, cid] of links) {
    guideClaims++;
    const own = claimOwner.get(cid);
    if (!own) { errors.push(`guides/${f}: cites unknown claim ${cid}`); continue; }
    if (SECTION[own.entity.type] !== section || own.entity.slug !== slug) errors.push(`guides/${f}: ${cid} belongs to /${SECTION[own.entity.type]}/${own.entity.slug}/, not /${section}/${slug}/`);
    if (fm?.status === 'published' && (own.claim.status !== 'approved' || own.entity.status !== 'published')) errors.push(`guides/${f}: published but cites unapproved/unpublished ${cid}`);
  }
}

if (errors.length) { console.error(`✗ ${errors.length} problem(s):\n  ` + errors.join('\n  ')); process.exit(1); }
const lv = { external: 0, internal: 0, draft: 0 };
for (const { doc } of entities) for (const c of doc.claims) lv[c.status === 'approved' ? (c.review_level || 'internal') : 'draft']++;
console.log(`✓ ${entities.length} entities valid; claims: ${lv.external} external, ${lv.internal} internal, ${lv.draft} draft; ${cmpFiles.length} comparisons; ${guideFiles.length} guides with ${guideClaims} claim citations`);
