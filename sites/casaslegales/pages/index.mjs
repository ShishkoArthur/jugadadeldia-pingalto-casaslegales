// Pages of casaslegales.com. kind: hub | registry | province | operator | tool | check | guide | help | service. Help pages (help: true) carry the help mark and
// must not link to pages of the kinds in BETTING_KINDS (gate helplink in tools/check-dist.mjs).
import { home } from './home.mjs';
import { licencias } from './licencias.mjs';
import { provinces } from './provincia.mjs';
import { provincias } from './provincias.mjs';
import { comoVerificar, menores, calcMargen, handicap } from './guias3.mjs';
import { ayuda, metodologia, redaccion, fuentes, notFound } from './service.mjs';
import { operatorPages } from './operador.mjs';
import { verificador } from './verificador.mjs';
import { checkPages } from './verificar.mjs';
import { betAr, ilegales, operadores, autoexclusion } from './guias.mjs';
import { calcCuotas, calcCombinada, leyFederal } from './guias4.mjs';
import { opProvPages } from './opprov.mjs';
import { casinoPages } from './opcasino.mjs';
import { casinos } from './casinos.mjs';
import { avisoLegal, contacto, privacidad } from './legal.mjs';

export const PAGES = [home, licencias, casinos, verificador, operadores, ...operatorPages, ...casinoPages, ...opProvPages, provincias, ...provinces, ...checkPages, betAr, ilegales, comoVerificar, menores, calcMargen, handicap, calcCuotas, calcCombinada, leyFederal, ayuda, autoexclusion, metodologia, redaccion, fuentes, avisoLegal, contacto, privacidad];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = ['registry', 'province', 'operator', 'tool'];
