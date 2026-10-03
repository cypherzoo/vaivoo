import { allEntities, publicClaims } from '../../lib/content.mjs';
export function GET() {
  const data = allEntities().map(({ section, url, ...e }) => ({ ...e, url, claims: publicClaims(e) }));
  return new Response(JSON.stringify({ schema_version: '1.1', generated_at: new Date().toISOString(), entities: data }, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
