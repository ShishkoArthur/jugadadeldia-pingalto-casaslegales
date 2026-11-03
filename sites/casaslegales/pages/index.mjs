// Pages of casaslegales.com. kind: hub | registry | province | help | service. Help pages (help: true) carry the help mark and
// must not link to pages of the kinds in BETTING_KINDS (gate helplink in tools/check-dist.mjs).
import { home } from './home.mjs';
import { licencias } from './licencias.mjs';
import { provinces } from './provincia.mjs';
import { ayuda, metodologia, redaccion, fuentes, notFound } from './service.mjs';

export const PAGES = [home, licencias, ...provinces, ayuda, metodologia, redaccion, fuentes];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = ['registry', 'province', 'operator', 'tool'];
