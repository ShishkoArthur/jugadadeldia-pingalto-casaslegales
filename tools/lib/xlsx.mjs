// Minimal reader of .xlsx workbooks (a zip of XML parts): the cell values of every sheet, no dependencies (node:zlib).
// readXlsx(buffer) -> [{ name, cells: { 'B3': 'text or number as string' } }] in workbook order. Formulas give their cached value.
import { inflateRawSync } from 'node:zlib';

export function unzip(buf) {
  const files = {};
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('xlsx: not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('xlsx: bad central directory');
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    files[name] = () => method === 0 ? raw : method === 8 ? inflateRawSync(raw) : (() => { throw new Error('xlsx: compression ' + method); })();
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}
const ent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const texts = xml => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => ent(m[1])).join('');

export function readXlsx(buf) {
  const z = unzip(buf);
  const part = n => z[n] ? z[n]().toString('utf8') : '';
  const shared = [...part('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => texts(m[1]));
  const rels = {};
  for (const m of part('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[0]), t = /\bTarget="([^"]+)"/.exec(m[0]);
    if (id && t) rels[id[1]] = t[1].replace(/^\/?(xl\/)?/, 'xl/');
  }
  const out = [];
  for (const m of part('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const name = /\bname="([^"]*)"/.exec(m[0]), rid = /\br:id="([^"]+)"/.exec(m[0]);
    const xml = rid && rels[rid[1]] ? part(rels[rid[1]]) : '';
    const cells = {};
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(c[1]);
      if (!ref || !c[2]) continue;
      const type = (/\bt="([^"]+)"/.exec(c[1]) || [])[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2]);
      let val = null;
      if (type === 's') val = v ? shared[+v[1]] : null;
      else if (type === 'inlineStr') val = texts(c[2]);
      else if (v) val = ent(v[1]);
      if (val != null && val !== '') cells[ref[1]] = val;
    }
    out.push({ name: name ? ent(name[1]) : '', cells });
  }
  return out;
}
