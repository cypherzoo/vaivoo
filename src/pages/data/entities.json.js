import { allEntities, publicClaims } from '../../lib/content.mjs';
// Public export. Every claim carries review_level: draft | internal | external | disputed.
export function GET() {
  const data = allEntities().map(({ section, url, ...e }) => ({
    ...e, url,
    claims: publicClaims(e).map(({ shown, review, ...c }) => ({ ...c, review_level: review }))
  }));
  return new Response(JSON.stringify({ schema_version: '1.1', generated_at: new Date().toISOString(), entities: data }, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
