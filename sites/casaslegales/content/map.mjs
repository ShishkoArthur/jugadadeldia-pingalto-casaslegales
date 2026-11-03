// Tile map of the 24 jurisdictions (23 provinces + CABA): short code and grid cell (row / column [/ row end / column end]) on a
// 5-column board, roughly north to south. Ids are the ids of the help package (data/sources/rg/helplines.json).
export const TILES = [
  ['jujuy', 'JUJ', '1/2'], ['salta', 'SAL', '1/3'], ['formosa', 'FOR', '1/4'], ['misiones', 'MIS', '1/5'],
  ['catamarca', 'CAT', '2/2'], ['tucuman', 'TUC', '2/3'], ['santiago-del-estero', 'SGO', '2/4'], ['chaco', 'CHA', '2/5'],
  ['san-juan', 'SJU', '3/1'], ['la-rioja', 'LRI', '3/2'], ['cordoba', 'CBA', '3/3'], ['santa-fe', 'SFE', '3/4'], ['corrientes', 'COR', '3/5'],
  ['mendoza', 'MZA', '4/1'], ['san-luis', 'SLU', '4/2'], ['buenos-aires', 'PBA', '4/3/6/5'], ['entre-rios', 'ERI', '4/5'],
  ['neuquen', 'NEU', '5/1'], ['la-pampa', 'LPA', '5/2'], ['caba', 'CABA', '5/5'],
  ['rio-negro', 'RNE', '6/1/7/3'], ['chubut', 'CHU', '7/1/8/3'], ['santa-cruz', 'SCR', '8/1/9/3'], ['tierra-del-fuego', 'TDF', '9/2'],
].map(([id, code, area]) => ({ id, code, area }));
export const SHORT = { 'buenos-aires': 'PBA', caba: 'CABA', cordoba: 'Córdoba' };
export const CODE = Object.fromEntries(TILES.map(t => [t.id, t.code]));
