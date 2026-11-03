// Pages of jugadadeldia.com. kind: hub | lottery | game | service | help. Lottery pages, the home and service pages carry the help
// block and 18+; game pages (truco and table games) do not (gate.noRgKinds). Help pages (help: true) must not link to pages of the
// kinds in BETTING_KINDS (gate helplink).
import { loadRg } from '../../../tools/lib/sources.mjs';
import { home } from './home.mjs';
import { quienes, quienEscribe, fuentes, notFound } from './service.mjs';
import { cuantoPaga, redoblonaPage } from './quiniela.mjs';
import { EXTRACT_PAGES } from './extractos.mjs';
import { quini6, lotoPlus, brinco, telekino, poceada, quinielaPlus } from './sorteos.mjs';
import { trucoHub, trucoJugar, trucoValores, trucoSenas, trucoAnotador, trucoEnvido } from './truco.mjs';
import { generala, generalaJugar, generalaProb, chinchonJugar, escobaJugar, dados, juegosCartas } from './juegos.mjs';
import { ayuda, autoexclusion, provincePages } from './help.mjs';
import { comoSeJuega, simulador, horarios, devuelve, quini6Como, quini6Controlar, telekinoControlar } from './guias.mjs';
import { trucoReglas, trucoPuntos, trucoQuiero, trucoFlor } from './truco2.mjs';
import { chinchon, chinchonAnotador, escoba, burako, burakoAnotador } from './cartas.mjs';
import { bolillero, glosario, privacidad } from './extra.mjs';

export const PAGES = [home, ...EXTRACT_PAGES, cuantoPaga, redoblonaPage, comoSeJuega, horarios, simulador, quini6, quini6Como, quini6Controlar, lotoPlus, brinco, telekino, telekinoControlar, poceada, quinielaPlus, devuelve, trucoHub, trucoReglas, trucoJugar, trucoAnotador, trucoValores, trucoSenas, trucoEnvido, trucoPuntos, trucoQuiero, trucoFlor, juegosCartas, generalaJugar, generala, generalaProb, chinchon, chinchonJugar, chinchonAnotador, escoba, escobaJugar, burako, burakoAnotador, dados, bolillero, quienes, quienEscribe, fuentes, glosario, privacidad, ayuda, autoexclusion, ...provincePages(loadRg())];
export const NOT_FOUND = notFound;
export const BETTING_KINDS = ['lottery', 'game'];
