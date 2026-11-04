// Sources of jugadadeldia.com at build time: lottery rules (data/sources/lottery, checked byte for byte by
// tools/lib/lottery-sources.mjs), truco and card/dice game rules (data/sources/<game>/rules.json, quotes checked by the engine
// tests). The build stops when a lottery source fails its check or a saved game document changed or is too old.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT } from '../../../tools/env.mjs';
import { loadLotteryFiles, verifyLottery } from '../../../tools/lib/lottery-sources.mjs';
import { daysBetween } from '../../../engine/format.mjs';
import { docMaxAge } from '../../../tools/lib/copyage.mjs';

export const GAME_MAX_AGE = 183;
const LOT_TITLES = {
  'lotba:quiniela-reglamento': 'Reglamento de La Quiniela de la Ciudad (Lotería de la Ciudad)',
  'lotba:quiniela-programa': 'Programa de sorteos de La Quiniela de la Ciudad, noviembre 2026',
  'lotba:quiniela-home': 'Sitio de La Quiniela de la Ciudad',
  'lotba:loto-reglamento': 'Reglamento del Loto Plus (Lotería de la Ciudad)',
  'lotba:loto-programa': 'Programa de sorteos del Loto Plus, noviembre 2026',
  'pba:quiniela-reglamento': 'Reglamento del Juego de Quiniela (Lotería de la Provincia de Buenos Aires)',
  'pba:juegos-tradicionales': 'Juegos tradicionales (Lotería de la Provincia de Buenos Aires)',
  'pba:telekino-reglamento': 'Reglamento del Telekino (IPLyC Provincia de Buenos Aires), copia publicada por Mendoza',
  'cajapopular:tipo-sorteo': 'Tipos de sorteo de la Quiniela de Tucumán y su hora (Caja Popular de Ahorros, API del sitio de resultados)',
  'cas:quini6-reglamento': 'Reglamento del Quini 6 y Brinco (Lotería de Santa Fe), copia publicada por Lotería de Río Negro',
  'online:caba-agencias': 'Agencias de juego en línea autorizadas en la Ciudad (Lotería de la Ciudad, Juego Seguro y Legal)',
  'online:pba-juego-online': 'Juego online en la Provincia de Buenos Aires (Instituto Provincial de Lotería y Casinos)',
  'online:cba-juegos-online': 'Sitios oficiales de juego online en Córdoba (Lotería de Córdoba)',
  'online:rne-rionegrina-online': 'La Rionegrina Online (Lotería de Río Negro)',
  'online:neu-juego-legal': 'Juego legal en Neuquén (Instituto Provincial de Juegos de Azar del Neuquén)',
  'online:mendoza-plataformas': 'Juego en línea en Mendoza (Instituto Provincial de Juegos y Casinos)',
  'online:lri-plataformas': 'Lista de plataformas autorizadas (AJALAR, La Rioja)',
  'online:santa-fe-plataformas': 'Juego online en Santa Fe: plataformas habilitadas (Lotería de Santa Fe)',
  'online:santa-fe-inicio': 'Sitio de la Lotería de Santa Fe',
};

export function loadSources(today) {
  const problems = [];
  if (verifyLottery({ today, log: m => { if (m.startsWith('  BAD')) problems.push(m.trim()); } })) throw new Error('lottery sources are not verified:\n' + problems.join('\n') + '\n(node tools/verify-sources.mjs)');
  const files = loadLotteryFiles();
  const docs = [];
  const facts = new Map();
  for (const f of files) {
    for (const [slug, d] of Object.entries(f.docs || {})) {
      const key = f.id + ':' + slug;
      if (!LOT_TITLES[key]) throw new Error('sources: no title for lottery document ' + key);
      docs.push({ key, group: 'Loterías', title: LOT_TITLES[key], url: d.linkedFrom || d.url, fetched: d.fetched, maxAge: docMaxAge(d, f.maxAgeDays), quotes: (f.facts || []).filter(x => x.doc === slug).length });
    }
    for (const x of f.facts || []) facts.set(x.id, { quote: x.quote, doc: f.id + ':' + x.doc, value: x.value });
  }
  const games = {};
  for (const g of ['truco', 'generala', 'chinchon', 'escoba', 'burako']) {
    const j = JSON.parse(readFileSync(join(ROOT, 'data/sources', g, 'rules.json'), 'utf8'));
    for (const [slug, d] of Object.entries(j.docs)) {
      const sha = createHash('sha256').update(readFileSync(join(ROOT, d.file))).digest('hex');
      if (sha !== d.sha256) throw new Error('sources: ' + g + ' document ' + slug + ' changed (sha256) - re-check the quotes');
      const age = daysBetween(d.fetched, today);
      if (age < 0 || age > GAME_MAX_AGE) throw new Error('sources: ' + g + ' document ' + slug + ' is ' + age + ' days old (max ' + GAME_MAX_AGE + ')');
      const key = g + ':' + slug;
      docs.push({ key, group: { truco: 'Truco', generala: 'Generala', chinchon: 'Chinchón', escoba: 'Escoba de 15', burako: 'Burako' }[g], title: d.title, url: d.url, fetched: d.fetched, maxAge: GAME_MAX_AGE,
        quotes: Object.values(j.quotes).filter(q => q.doc === slug).length });
    }
    for (const [id, q] of Object.entries(j.quotes)) facts.set(g + '.' + id, { quote: q.text, doc: g + ':' + q.doc });
  }
  const byKey = Object.fromEntries(docs.map(d => [d.key, d]));
  return {
    docs,
    value(id) {
      const f = facts.get(id);
      if (!f || f.value === undefined) throw new Error('sources: no value for ' + id);
      return f.value;
    },
    fact(id) {
      const f = facts.get(id);
      if (!f) throw new Error('sources: no quote ' + id);
      return { ...f, d: byKey[f.doc] };
    },
  };
}
