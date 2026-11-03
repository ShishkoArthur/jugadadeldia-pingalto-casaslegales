// Games of the sensitivity converter and their yaw (degrees per mouse count at sensitivity 1). Each yaw is a quoted fact in
// data/sources/pingalto/sources.json; `extra` names a second source that confirms the same value.
export const SENS_GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', fact: 'yaw_cs2', extra: 'yaw_source', step: '0.01' },
  { id: 'valorant', name: 'Valorant', short: 'Valorant', fact: 'yaw_valorant', step: '0.001', riot: true },
  { id: 'ow2', name: 'Overwatch 2', short: 'OW2', fact: 'yaw_ow2', step: '0.01' },
  { id: 'apex', name: 'Apex Legends', short: 'Apex', fact: 'yaw_cs2', step: '0.01' },
];
export const sensGames = h => SENS_GAMES.map(g => ({ ...g, yaw: h.pa.fact(g.fact) }));
