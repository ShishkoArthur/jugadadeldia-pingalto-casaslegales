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
import { esportsSeries, esportsHub } from './series.mjs';
import { cs2Ranking, cs2Major } from './vrs.mjs';
import { lolHub, valorantHub, ffHub, ffCodigos } from './hubs.mjs';
import { equipo, metodo, datos, contacto, legal, notFound } from './service.mjs';
import { FEED_PAGES } from './feeds.mjs';
import { WAVE4 } from './wave4.mjs';
import { fortniteHub, ffMax } from './games2.mjs';

export const PAGES = [home, ping, sensibilidad, dpi, tierList, ffHub, ffSensibilidad, ffNombres, ffEspacio, ffCodigos, ffMax, valorantHub, valorantRangos, valorantAgentes, cs2Ranking, cs2Major, cs2Mira, lolHub, lolRangos, fortniteHub, fortniteNube, esportsHub, esportsSeries, ...FEED_PAGES, ...WAVE4, equipo, metodo, datos, contacto, legal];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = [];
