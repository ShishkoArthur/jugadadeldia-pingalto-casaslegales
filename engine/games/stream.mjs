// Cloud gaming data: what a stream at a given speed moves per hour, and how long a mobile data plan lasts at that speed.
// Decimal units as the carriers sell them (1 GB = 1000 MB = 8000 megabits). Pure.
export function gbPerHour(mbps) {
  if (!(mbps > 0)) throw new Error('gbPerHour: speed must be positive');
  return (mbps * 3600) / 8 / 1000;
}
export function hoursFromPlan({ gb, mbps }) {
  if (!(gb >= 0)) throw new Error('hoursFromPlan: bad plan');
  return gb / gbPerHour(mbps);
}
export function gbForPlay({ hoursPerDay, daysPerWeek, mbps, weeks = 30 / 7 }) {
  return gbPerHour(mbps) * hoursPerDay * daysPerWeek * weeks;
}
