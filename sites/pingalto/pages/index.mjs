// Pages of pingalto.com. kind: hub | tool | service. Not a gambling site: no help pages (gate.gambling = false in config).
import { home } from './home.mjs';
import { sensibilidad, dpi, ping } from './kit.mjs';
import { ffSensibilidad } from './ff.mjs';
import { valorantRangos, lolRangos } from './ranks.mjs';
import { cs2Mira } from './cs2.mjs';
import { valorantAgentes } from './valorant.mjs';
import { ffNombres, ffEspacio } from './names.mjs';
import { fortniteNube } from './fortnite.mjs';
import { tierList } from './tier.mjs';
import { equipo, metodo, datos, contacto, legal, notFound } from './service.mjs';

export const PAGES = [home, ping, sensibilidad, dpi, tierList, ffSensibilidad, ffNombres, ffEspacio, valorantRangos, valorantAgentes, cs2Mira, lolRangos, fortniteNube, equipo, metodo, datos, contacto, legal];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = [];
