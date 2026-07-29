/**
 * Evaluates whether two half-open time intervals [startA, endA) and [startB, endB) overlap.
 * Returns true if they collide, false if they are adjacent or non-overlapping.
 */
export function doIntervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

/**
 * Validates whether a booking duration is between 30 minutes and 4 hours (240 minutes).
 */
export function isValidDuration(startTime: Date, endTime: Date): boolean {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMins = durationMs / (1000 * 60);
  return durationMins >= 30 && durationMins <= 240;
}

/**
 * Validates 30-minute slot alignment in UTC (minutes must be 0 or 30, seconds must be 0).
 */
export function is30MinAligned(date: Date): boolean {
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();
  return (minutes === 0 || minutes === 30) && seconds === 0 && ms === 0;
}
