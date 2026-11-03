// Mouse sensitivity between games (pingalto /kit/sensibilidad). Pure functions, same code in the browser and in Node.
// yaw = degrees of view rotation per mouse count at in-game sensitivity 1 (one constant per game, each with a source in
// data/sources/pingalto/sources.json). One inch is exactly 2.54 cm (international inch). No defaults: every argument is required.
export const CM_PER_INCH = 2.54;

function pos(name, v) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new Error('sens: ' + name + ' must be a positive number, got ' + v);
  return v;
}
// Degrees turned per centimetre of mouse travel.
export function degPerCm({ dpi, sens, yaw }) {
  return (pos('dpi', dpi) / CM_PER_INCH) * pos('sens', sens) * pos('yaw', yaw);
}
// Centimetres of mouse travel for a full 360 degree turn.
export function cm360({ dpi, sens, yaw }) {
  return 360 / degPerCm({ dpi, sens, yaw });
}
// Sensitivity in the target game that keeps the same cm/360.
export function convertSens({ sens, dpi, yaw, toDpi, toYaw }) {
  return (pos('sens', sens) * pos('dpi', dpi) * pos('yaw', yaw)) / (pos('toDpi', toDpi) * pos('toYaw', toYaw));
}
// Sensitivity that gives a wanted cm/360.
export function sensForCm360({ cm, dpi, yaw }) {
  return 360 / (pos('cm', cm) * (pos('dpi', dpi) / CM_PER_INCH) * pos('yaw', yaw));
}
// eDPI = DPI x sensitivity: compares setups inside ONE game only (the yaw differs between games).
export function edpi({ dpi, sens }) {
  return pos('dpi', dpi) * pos('sens', sens);
}
