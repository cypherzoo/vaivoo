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
    if (c.status === 'approved') {
      if (!c.evidence.some(e => e.stance === 'supports')) errors.push(`${f}: ${c.id} approved without supporting evidence`);
      if (!c.reviewed_by?.length || !c.reviewed_at) errors.push(`${f}: ${c.id} approved without reviewer/date`);
      if (c.review_tier === 'C' && (c.reviewed_by?.length ?? 0) < 2) errors.push(`${f}: ${c.id} Tier C needs owner + independent technical reviewer`);
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

if (errors.length) { console.error(`✗ ${errors.length} problem(s):\n  ` + errors.join('\n  ')); process.exit(1); }
const pub = entities.filter(e => e.doc.status === 'published').length;
console.log(`✓ ${entities.length} entities valid (${pub} published, ${entities.length - pub} not public)`);
