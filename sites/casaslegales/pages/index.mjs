// Pages of casaslegales.com. kind: hub | registry | province | operator | tool | check | guide | help | service. Help pages (help: true) carry the help mark and
// must not link to pages of the kinds in BETTING_KINDS (gate helplink in tools/check-dist.mjs).
import { home } from './home.mjs';
import { licencias } from './licencias.mjs';
import { provinces } from './provincia.mjs';
import { ayuda, metodologia, redaccion, fuentes, notFound } from './service.mjs';
import { operatorPages } from './operador.mjs';
import { verificador } from './verificador.mjs';
import { checkPages } from './verificar.mjs';
import { betAr, ilegales, operadores, autoexclusion } from './guias.mjs';

export const PAGES = [home, licencias, verificador, operadores, ...operatorPages, ...provinces, ...checkPages, betAr, ilegales, ayuda, autoexclusion, metodologia, redaccion, fuentes];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = ['registry', 'province', 'operator', 'tool'];
