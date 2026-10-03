import { allEntities, publicClaims } from '../../lib/content.mjs';
// Public export: unapproved claims are exported as value "unknown" with unverified: true (never the proposed value).
export function GET() {
  const data = allEntities().map(({ section, url, ...e }) => ({
    ...e, url,
    claims: publicClaims(e).map(({ shown, ...c }) => ({ ...c, value: shown }))
  }));
  return new Response(JSON.stringify({ schema_version: '1.1', generated_at: new Date().toISOString(), entities: data }, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
