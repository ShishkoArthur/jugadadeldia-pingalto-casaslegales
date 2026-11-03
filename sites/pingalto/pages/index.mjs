// Pages of pingalto.com. kind: hub | tool | service. Not a gambling site: no help pages (gate.gambling = false in config).
import { home } from './home.mjs';
import { sensibilidad, dpi, ping } from './kit.mjs';
import { ffSensibilidad } from './ff.mjs';
import { valorantRangos, lolRangos } from './ranks.mjs';
import { equipo, metodo, datos, contacto, legal, notFound } from './service.mjs';

export const PAGES = [home, ping, sensibilidad, dpi, ffSensibilidad, valorantRangos, lolRangos, equipo, metodo, datos, contacto, legal];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = [];
