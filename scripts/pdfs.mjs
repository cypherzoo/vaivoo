// Builds the downloadable datasheet PDFs (Direction C) into dist/pdf/.
// Pure JavaScript (PDFKit), so it runs anywhere `npm run build` runs. Fonts are the self-hosted Fontsource files.
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import wawoff2 from 'wawoff2';
import { allEntities, allComparisons, comparisonCell, publicClaims, reviewSummary, monthLabel, VALUE_LABEL, LABELS, REVIEW, SECTION_ORDER } from '../src/lib/content.mjs';
import { docId, cmpDocId, num, sources } from '../src/lib/sheet.mjs';

const OUT = path.resolve(process.argv[2] || 'dist', 'pdf');
fs.mkdirSync(OUT, { recursive: true });

const font = (pkg, file) => path.resolve('node_modules', pkg, 'files', file);
const FONTS = {
  mono: font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2'),
  monoM: font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2'),
  monoB: font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-700-normal.woff2'),
  sans: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-400-normal.woff2'),
  sansM: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-500-normal.woff2'),
  sansB: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-700-normal.woff2'),
  sansX: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-900-normal.woff2')
};
// WOFF2 -> TTF once, so PDFKit can subset the fonts.
const TTF = {};
for (const [k, f] of Object.entries(FONTS)) TTF[k] = Buffer.from(await wawoff2.decompress(fs.readFileSync(f)));
const C = { ink: '#0a0a0a', mute: '#5a5a5a', line: '#cfcfcc', acc: '#5b2bff', accSoft: '#b9a6ff', ext: '#15703f', int: '#c2560c', grey: '#7a7a7a' };
const M = 34;
const NOW = new Date().toISOString();
const GENERATED = monthLabel(NOW);
const REV = NOW.slice(0, 7);
const DOTS = [['g', 'w', 'g'], ['g', 'g', 'w'], ['g', 'g', 'w']];
// PDFKit's standard text breaks at hyphens; keep text clean of characters the fonts lack.
const clean = s => String(s ?? '').replace(/[‑]/g, '-');

function newDoc({ title, subject, landscape = false }) {
  const doc = new PDFDocument({ size: 'A4', layout: landscape ? 'landscape' : 'portrait', margin: M, bufferPages: true, autoFirstPage: false,
    info: { Title: title, Author: 'The Vaivoo Project', Subject: subject, Creator: 'vaivoo.com', Keywords: 'authentication, cryptography, datasheet' }, lang: 'en' });
  for (const [k, b] of Object.entries(TTF)) doc.registerFont(k, b);
  doc.pageIds = [];
  return doc;
}
const W = doc => doc.page.width - 2 * M;
const bottom = doc => doc.page.height - M - 22;

function mark(doc, x, y, s, { edge = false } = {}) {
  doc.save().roundedRect(x, y, s, s, s * 0.17).fill(C.ink);
  if (edge) doc.roundedRect(x, y, s, s, s * 0.17).lineWidth(0.5).stroke('#555555');
  const r = s * 0.082, step = s * 0.235, o = s * 0.265;
  DOTS.forEach((row, i) => row.forEach((v, j) => doc.circle(x + o + j * step, y + o + i * step, r).fill(v === 'g' ? C.grey : '#ffffff')));
  doc.restore();
}
function inkDots(doc, x, y, d = 4.2, gap = 1.8) {
  DOTS.forEach((row, i) => row.forEach((v, j) => {
    const cx = x + j * (d + gap) + d / 2, cy = y + i * (d + gap) + d / 2;
    if (v === 'w') doc.circle(cx, cy, d / 2).fill(C.ink); else doc.circle(cx, cy, d / 2 - 0.3).lineWidth(0.6).stroke(C.ink);
  }));
}
function stamp(doc, x, y, level) {
  const label = (REVIEW[level]?.short ?? 'Draft').toUpperCase();
  const col = level === 'external' ? C.ext : level === 'internal' ? C.int : C.ink;
  doc.font('monoM').fontSize(5.6);
  const w = doc.widthOfString(label) + 12, h = 8.5;
  doc.save().lineWidth(0.7);
  if (level === 'draft' || level === 'disputed') doc.dash(1.5, { space: 1.2 });
  doc.rect(x, y, w, h).stroke(col).undash();
  if (level === 'draft' || level === 'disputed') doc.circle(x + 4.2, y + h / 2, 1.4).lineWidth(0.5).stroke(col);
  else doc.circle(x + 4.2, y + h / 2, 1.5).fill(col);
  doc.fillColor(col).text(label, x + 7.5, y + 1.9, { lineBreak: false });
  doc.restore();
  return h;
}

function header(doc, { title, id, kind }) {
  const x = M, y = M, w = W(doc), H = 46, bw = 124, kw = 92;
  doc.rect(x, y, bw, H).fill(C.ink);
  mark(doc, x + 11, y + 12, 22, { edge: true });
  doc.font('sansX').fontSize(13).fillColor('#ffffff').text('VAIVOO', x + 40, y + 16.5, { characterSpacing: 1.6, lineBreak: false });
  // title: shrink to fit two lines
  const tw = w - bw - kw - 20;
  let fs = 17;
  doc.font('sansX');
  while (fs > 9 && doc.fontSize(fs).heightOfString(clean(title).toUpperCase(), { width: tw, lineGap: -2 }) > (fs * 2.05)) fs -= 0.5;
  const th = doc.fontSize(fs).heightOfString(clean(title).toUpperCase(), { width: tw, lineGap: -2 });
  const ty = y + Math.max(5, (H - th - 10) / 2);
  doc.fillColor(C.ink).text(clean(title).toUpperCase(), x + bw + 10, ty, { width: tw, lineGap: -2 });
  doc.font('monoM').fontSize(6.6).fillColor(C.ink).text(`${id}  ·  REV ${REV}`, x + bw + 10, ty + th + 2, { width: tw, lineBreak: false });
  doc.moveTo(x + w - kw, y).lineTo(x + w - kw, y + H).lineWidth(0.8).stroke(C.ink);
  inkDots(doc, x + w - 26, y + 9);
  doc.font('monoM').fontSize(6.2).fillColor(C.ink).text(kind.toUpperCase(), x + w - kw + 6, y + H - 14, { width: kw - 12, align: 'right', lineBreak: false });
  doc.rect(x, y, w, H).lineWidth(1.4).stroke(C.ink);
  doc.rect(x, y + H, w, 4).fill(C.acc);
  doc.rect(x, y, w, H + 4).lineWidth(1.4).stroke(C.ink);
  return y + H + 4;
}
function metaRow(doc, y, cells, review) {
  const x = M, w = W(doc), H = 32, cw = w / (cells.length + 1);
  cells.forEach(([k, v], i) => {
    const cx = x + i * cw;
    doc.font('monoM').fontSize(5.6).fillColor(C.mute).text(k.toUpperCase(), cx + 7, y + 6, { width: cw - 12, characterSpacing: 0.3, lineBreak: false });
    doc.font('sansB').fontSize(10).fillColor(C.ink).text(clean(v), cx + 7, y + 15.5, { width: cw - 12, lineBreak: false, ellipsis: true });
    doc.moveTo(cx + cw, y).lineTo(cx + cw, y + H).lineWidth(0.6).stroke(C.ink);
  });
  const rx = x + cells.length * cw + 7, rw = cw - 14, t = review.total || 1;
  doc.font('monoM').fontSize(5.6).fillColor(C.mute).text('REVIEW', rx, y + 6, { lineBreak: false });
  const ew = rw * review.counts.external / t, iw = rw * review.counts.internal / t;
  if (ew) doc.rect(rx, y + 14, ew, 6).fill(C.ext);
  if (iw) doc.rect(rx + ew, y + 14, iw, 6).fill(C.int);
  doc.rect(rx, y + 14, rw, 6).lineWidth(0.6).stroke(C.ink);
  doc.font('monoM').fontSize(5.6).fillColor(C.ink).text(`${review.counts.external} EXT · ${review.counts.internal} INT · ${review.counts.draft} DRAFT`, rx, y + 23, { width: rw, lineBreak: false });
  doc.rect(x, y, w, H).lineWidth(1.4).stroke(C.ink);
  return y + H;
}
function summary(doc, y, text) {
  doc.font('sansM').fontSize(10.5).fillColor(C.ink);
  const h = doc.heightOfString(clean(text), { width: W(doc), lineGap: 1.5 });
  doc.text(clean(text), M, y + 10, { width: W(doc), lineGap: 1.5 });
  const yy = y + 10 + h + 8;
  doc.moveTo(M, yy).lineTo(M + W(doc), yy).lineWidth(0.6).stroke(C.ink);
  return yy;
}
function sectionBar(doc, y, left, right) {
  doc.rect(M, y, W(doc), 14).fill(C.ink);
  doc.font('monoM').fontSize(6.6).fillColor('#ffffff').text(left.toUpperCase(), M + 7, y + 4, { lineBreak: false, characterSpacing: 0.3 });
  if (right) {
    doc.font('monoM').fontSize(6.6);
    const rw = doc.widthOfString(right.toUpperCase());
    doc.fillColor('#ffffff').text(right.toUpperCase(), M + W(doc) - rw - 7, y + 4, { lineBreak: false });
  }
  return y + 14;
}
function runningHead(doc, id, title) {
  mark(doc, M, M - 2, 11);
  doc.font('monoM').fontSize(6.6).fillColor(C.ink).text(`VAIVOO  ·  ${id}  ·  ${clean(title).toUpperCase()}`, M + 16, M + 0.5, { width: W(doc) - 16, lineBreak: false, ellipsis: true });
  doc.rect(M, M + 13, W(doc), 1.6).fill(C.acc);
  return M + 22;
}
function addPage(doc, id, title, { first = false } = {}) {
  doc.addPage();
  doc.pageIds.push(id);
  return first ? M : runningHead(doc, id, title);
}

// --- tables ---------------------------------------------------------------
function tableHead(doc, y, cols) {
  let x = M;
  doc.font('monoM').fontSize(5.8).fillColor(C.mute);
  cols.forEach(c => { doc.text(c.label.toUpperCase(), x, y + 5, { width: c.w - 6, lineBreak: false, characterSpacing: 0.3 }); x += c.w; });
  doc.moveTo(M, y + 15).lineTo(M + W(doc), y + 15).lineWidth(0.9).stroke(C.ink);
  return y + 15;
}
function bullets(doc, items, x, y, w, size = 7.3) {
  let yy = y;
  doc.font('sans').fontSize(size).fillColor(C.ink);
  for (const it of items) {
    doc.circle(x + 2, yy + size * 0.6, 0.9).fill(C.ink);
    const h = doc.heightOfString(clean(it), { width: w - 8, lineGap: 0.5 });
    doc.fillColor(C.ink).text(clean(it), x + 7, yy, { width: w - 8, lineGap: 0.5 });
    yy += h + 1.5;
  }
  return yy - y;
}
function bulletsHeight(doc, items, w, size = 7.3) {
  doc.font('sans').fontSize(size);
  return items.reduce((s, it) => s + doc.heightOfString(clean(it), { width: w - 8, lineGap: 0.5 }) + 1.5, 0);
}

function claimRows(doc, y, e, claims, srcs) {
  const w = W(doc);
  const cols = [{ label: '#', w: 30 }, { label: 'Property', w: 76 }, { label: 'Value', w: 76 }, { label: 'Claim and scope', w: w - 30 - 76 - 76 - 128 }, { label: 'Evidence', w: 128 }];
  const id = docId(e);
  y = tableHead(doc, y, cols);
  const ref = url => 'S' + String(srcs.findIndex(s => s.url === url) + 1).padStart(2, '0');
  claims.forEach((c, i) => {
    const pad = 5, cw = cols.map(c => c.w - 7);
    const prop = c.predicate.replaceAll('_', ' ').toUpperCase();
    const who = c.reviewed_by?.length > 0 && c.review !== 'draft' ? `${c.reviewed_by.join(', ')}${c.reviewed_at ? ' · ' + String(c.reviewed_at).slice(0, 7) : ''}` : '';
    const scope = `Scope: ${c.scope}${c.claim_type !== 'fact' ? ' · ' + c.claim_type.replace('_', ' ') : ''}`;
    const ev = c.evidence.map(x => `${ref(x.url)}  ${x.locator}${x.stance !== 'supports' ? ` (${x.stance})` : ''}`);
    doc.font('sansB').fontSize(7.8); const hProp = doc.heightOfString(prop, { width: cw[1] });
    doc.font('monoB').fontSize(6.8); const hVal = doc.heightOfString(VALUE_LABEL[c.shown].toUpperCase(), { width: cw[2] }) + 11 + (who ? (doc.font('mono').fontSize(5.8), doc.heightOfString(who, { width: cw[2] }) + 2) : 0);
    doc.font('sans').fontSize(8); const hSt = doc.heightOfString(clean(c.statement), { width: cw[3], lineGap: 0.8 });
    const hAs = c.assumptions.length ? bulletsHeight(doc, c.assumptions, cw[3]) + 2 : 0;
    doc.font('sans').fontSize(7); const hSc = doc.heightOfString(clean(scope), { width: cw[3] });
    doc.font('mono').fontSize(6.2); const hEv = ev.reduce((s, t) => s + doc.heightOfString(clean(t), { width: cw[4], lineGap: 0.4 }) + 2, 0);
    const h = Math.max(hProp, hVal, hSt + hAs + hSc + 3, hEv) + pad * 2;
    if (y + h > bottom(doc)) { y = addPage(doc, id, e.name); y = tableHead(doc, y, cols); }
    let x = M; const ty = y + pad;
    doc.font('monoB').fontSize(7).fillColor(C.acc).text(num(i), x, ty, { lineBreak: false }); x += cols[0].w;
    doc.font('sansB').fontSize(7.8).fillColor(C.ink).text(prop, x, ty, { width: cw[1] }); x += cols[1].w;
    doc.font('monoB').fontSize(6.8).fillColor(C.ink).text(VALUE_LABEL[c.shown].toUpperCase(), x, ty, { width: cw[2] });
    const vy = doc.y + 1.5; stamp(doc, x, vy, c.review);
    if (who) doc.font('mono').fontSize(5.8).fillColor(C.mute).text(clean(who), x, vy + 10.5, { width: cw[2] });
    x += cols[2].w;
    doc.font('sans').fontSize(8).fillColor(C.ink).text(clean(c.statement), x, ty, { width: cw[3], lineGap: 0.8 });
    let yy = ty + hSt + 1.5;
    if (c.assumptions.length) yy += bullets(doc, c.assumptions, x, yy, cw[3]) + 1;
    doc.font('sans').fontSize(7).fillColor(C.mute).text(clean(scope), x, yy, { width: cw[3] });
    x += cols[3].w;
    let ey = ty;
    for (const t of ev) {
      const [r, ...rest] = t.split('  ');
      doc.font('monoB').fontSize(6.2).fillColor(C.acc).text(r, x, ey, { continued: true, lineGap: 0.4, width: cw[4] })
        .font('mono').fillColor(C.ink).text('  ' + clean(rest.join('  ')), { lineGap: 0.4, width: cw[4] });
      ey = doc.y + 2;
    }
    y += h;
    doc.moveTo(M, y).lineTo(M + w, y).lineWidth(0.45).stroke(C.line);
  });
  return y;
}
function sourceList(doc, y, e, srcs) {
  const id = docId(e), w = W(doc);
  srcs.forEach((s, i) => {
    const r = 'S' + String(i + 1).padStart(2, '0');
    const line = `${clean(s.title)} — ${clean(s.publisher)}${s.version ? ', ' + clean(s.version) : ''}. Retrieved ${monthLabel(s.retrieved_at)}.`;
    doc.font('sansB').fontSize(7.6); const h1 = doc.heightOfString(line, { width: w - 30 });
    doc.font('mono').fontSize(6); const h2 = doc.heightOfString(s.url, { width: w - 30 });
    const h = h1 + h2 + 8;
    if (y + h > bottom(doc)) y = addPage(doc, id, e.name);
    doc.font('monoB').fontSize(6.6).fillColor(C.acc).text(r, M, y + 4, { lineBreak: false });
    doc.font('sansB').fontSize(7.6).fillColor(C.ink).text(line, M + 30, y + 3.5, { width: w - 30 });
    doc.font('mono').fontSize(6).fillColor(C.mute).text(s.url, M + 30, y + 4 + h1, { width: w - 30, link: s.url, underline: false });
    y += h;
    doc.moveTo(M, y).lineTo(M + w, y).lineWidth(0.45).stroke(C.line);
  });
  return y;
}

// --- documents --------------------------------------------------------------
function entityPages(doc, e) {
  const id = docId(e), claims = publicClaims(e), s = reviewSummary(claims), srcs = sources(claims);
  let y = addPage(doc, id, e.name, { first: true });
  y = header(doc, { title: e.name, id, kind: LABELS[e.section] });
  y = metaRow(doc, y, [['Claims', String(s.total)], ['Last verified', monthLabel(e.last_verified_at) ?? '—'], ['Next review', monthLabel(e.next_review_at) ?? '—'], ['Editor', e.owner]], s);
  y = summary(doc, y, e.summary);
  y = sectionBar(doc, y + 12, '01 · Claims', `${s.total} scoped statements`);
  y = claimRows(doc, y + 2, e, claims, srcs);
  if (y + 60 > bottom(doc)) y = addPage(doc, id, e.name); else y += 14;
  y = sectionBar(doc, y, '02 · Sources', `${srcs.length} documents`);
  sourceList(doc, y + 2, e, srcs);
}
function footers(doc, live) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.page.margins.bottom = 0;
    const y = doc.page.height - M - 12, w = W(doc), id = doc.pageIds[i];
    doc.moveTo(M, y - 4).lineTo(M + w, y - 4).lineWidth(1.2).stroke(C.ink);
    const l = typeof live === 'function' ? live(id) : live;
    doc.font('mono').fontSize(5.8).fillColor(C.mute).text(`THE VAIVOO PROJECT  ·  Snapshot of ${l}, generated ${GENERATED}. Check the live page.`, M, y, { width: w - 120, lineBreak: false, ellipsis: true });
    doc.font('monoB').fontSize(5.8).fillColor(C.ink).text(`${id}  ·  ${i + 1}/${range.count}`, M + w - 118, y, { width: 118, align: 'right', lineBreak: false });
  }
}
const save = (doc, file) => new Promise((res, rej) => {
  const out = fs.createWriteStream(path.join(OUT, file));
  out.on('finish', res); out.on('error', rej);
  doc.pipe(out); doc.end();
});

const entities = allEntities();
const order = s => { const i = SECTION_ORDER.indexOf(s); return i < 0 ? 99 : i; };
const sorted = [...entities].sort((a, b) => order(a.section) - order(b.section) || a.name.localeCompare(b.name));
const jobs = [];

for (const e of entities) {
  const doc = newDoc({ title: `${e.name} — Vaivoo datasheet ${docId(e)}`, subject: e.summary });
  entityPages(doc, e);
  footers(doc, `vaivoo.com${e.url}`);
  jobs.push(save(doc, `${docId(e)}.pdf`));
}

for (const cmp of allComparisons()) {
  const id = cmpDocId(cmp);
  const doc = newDoc({ title: `${cmp.title} — Vaivoo comparison ${id}`, subject: cmp.summary, landscape: true });
  const cells = cmp.rows.flatMap(r => cmp.columns.map(c => comparisonCell(c, r))).filter(Boolean);
  const s = reviewSummary(cells.map(c => c.claim));
  let y = addPage(doc, id, cmp.title, { first: true });
  y = header(doc, { title: cmp.title, id, kind: 'Comparison' });
  y = metaRow(doc, y, [['Setups', String(cmp.columns.length)], ['Properties', String(cmp.rows.length)], ['Generated', GENERATED], ['Editor', cmp.owner]], s);
  y = summary(doc, y, cmp.summary);
  y = sectionBar(doc, y + 12, 'Side by side', `${cells.length} cells from scoped claims`);
  const w = W(doc), n = cmp.columns.length, cw = (w - 30 - 96) / n;
  const cols = [{ label: '#', w: 30 }, { label: 'Property', w: 96 }, ...cmp.columns.map(c => ({ label: c.label, w: cw }))];
  y = tableHead(doc, y + 2, cols);
  cmp.rows.forEach((row, i) => {
    const pad = 5, inner = cw - 8;
    const parts = cmp.columns.map(col => {
      const cell = comparisonCell(col, row);
      if (!cell) return null;
      const v = (row.labels?.[cell.claim.id] ?? VALUE_LABEL[cell.claim.shown]).toUpperCase();
      doc.font('monoB').fontSize(6.8); const hv = doc.heightOfString(clean(v), { width: inner });
      doc.font('sans').fontSize(7.6); const hs = doc.heightOfString(clean(cell.claim.statement), { width: inner, lineGap: 0.6 });
      const ha = cell.claim.assumptions.length ? bulletsHeight(doc, cell.claim.assumptions, inner, 7) + 3 : 0;
      return { cell, v, h: hv + 12 + hs + ha };
    });
    doc.font('sansB').fontSize(8); const hp = doc.heightOfString(row.label, { width: 88 });
    const h = Math.max(hp, ...parts.map(p => (p ? p.h : 10))) + pad * 2;
    if (y + h > bottom(doc)) { y = addPage(doc, id, cmp.title); y = tableHead(doc, y, cols); }
    const ty = y + pad;
    doc.font('monoB').fontSize(7).fillColor(C.acc).text(num(i, 'R'), M, ty, { lineBreak: false });
    doc.font('sansB').fontSize(8).fillColor(C.ink).text(clean(row.label).toUpperCase(), M + 30, ty, { width: 88 });
    parts.forEach((p, j) => {
      const x = M + 30 + 96 + j * cw;
      if (!p) { doc.font('monoB').fontSize(6.8).fillColor(C.mute).text('NO CLAIM YET', x, ty, { width: inner }); return; }
      doc.font('monoB').fontSize(6.8).fillColor(C.ink).text(clean(p.v), x, ty, { width: inner });
      const sy = doc.y + 1.5; stamp(doc, x, sy, p.cell.claim.review);
      doc.font('sans').fontSize(7.6).fillColor('#333333').text(clean(p.cell.claim.statement), x, sy + 11.5, { width: inner, lineGap: 0.6 });
      if (p.cell.claim.assumptions.length) bullets(doc, p.cell.claim.assumptions, x, doc.y + 2, inner, 7);
    });
    y += h;
    doc.moveTo(M, y).lineTo(M + w, y).lineWidth(0.45).stroke(C.line);
  });
  doc.font('mono').fontSize(6.4).fillColor(C.mute);
  if (y + 24 > bottom(doc)) y = addPage(doc, id, cmp.title);
  doc.text('"No claim yet" means not researched, not "no". Evidence for every cell is on the linked entry pages at vaivoo.com.', M, y + 8, { width: w });
  footers(doc, `vaivoo.com/compare/${cmp.slug}/`);
  jobs.push(save(doc, `${id}.pdf`));
}

{ // full reference
  const all = reviewSummary(entities.flatMap(publicClaims));
  const doc = newDoc({ title: 'Full reference — The Vaivoo Project VA-REF-ALL', subject: 'Every entry in The Vaivoo Project, one datasheet per entry.' });
  let y = addPage(doc, 'VA-REF-ALL', 'Full reference', { first: true });
  y = header(doc, { title: 'Full reference', id: 'VA-REF-ALL', kind: 'All sections' });
  y = metaRow(doc, y, [['Entries', String(entities.length)], ['Claims', String(all.total)], ['Generated', GENERATED], ['Editor', 'Chris War']], all);
  y = summary(doc, y, 'Every entry in The Vaivoo Project, one datasheet per entry. Each claim is scoped, tied to the exact section of a primary source, and carries its review status: green for independent external review, orange for internal review by the editor, dashed for drafts.');
  y = sectionBar(doc, y + 12, 'Contents', `${entities.length} entries`);
  const cols = [{ label: 'Doc ID', w: 190 }, { label: 'Entry', w: W(doc) - 190 - 110 - 50 }, { label: 'Section', w: 110 }, { label: 'Claims', w: 50 }];
  y = tableHead(doc, y + 2, cols);
  for (const e of sorted) {
    if (y + 13 > bottom(doc)) { y = addPage(doc, 'VA-REF-ALL', 'Full reference'); y = tableHead(doc, y, cols); }
    doc.font('mono').fontSize(6.4).fillColor(C.ink).text(docId(e), M, y + 4, { lineBreak: false });
    doc.font('sansB').fontSize(8).text(clean(e.name), M + 190, y + 3.2, { width: cols[1].w - 6, lineBreak: false, ellipsis: true });
    doc.font('sans').fontSize(8).text(LABELS[e.section], M + 190 + cols[1].w, y + 3.2, { lineBreak: false });
    doc.font('monoB').fontSize(7).text(String(publicClaims(e).length), M + W(doc) - 50, y + 3.6, { lineBreak: false });
    y += 13;
    doc.moveTo(M, y).lineTo(M + W(doc), y).lineWidth(0.45).stroke(C.line);
  }
  for (const e of sorted) entityPages(doc, e);
  const urlOf = Object.fromEntries(sorted.map(e => [docId(e), `vaivoo.com${e.url}`]));
  footers(doc, id => urlOf[id] ?? 'vaivoo.com/reference/');
  jobs.push(save(doc, 'VA-REF-ALL.pdf'));
}

await Promise.all(jobs);
console.log(`pdfs: wrote ${jobs.length} files to ${path.relative(process.cwd(), OUT)}`);
