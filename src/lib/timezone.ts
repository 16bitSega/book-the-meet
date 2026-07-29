import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, addWeeks, getHours, getMinutes } from "date-fns";

export const KYIV_TIMEZONE = "Europe/Kyiv";
export const OFFICE_START_HOUR = 9;  // 09:00 Kyiv
export const OFFICE_END_HOUR = 19;   // 19:00 Kyiv

/**
 * Normalizes an input date string (YYYY-MM-DD or ISO) to Monday 00:00:00.000
 * and returns the half-open date range [weekStartKyivUtc, weekEndKyivUtc) for DB queries.
 */
export function getKyivWeekBounds(weekStartInput: string): {
  weekStartUtc: Date;
  weekEndUtc: Date;
  normalizedMondayKyiv: string; // YYYY-MM-DD
} {
  // Parse input string in Kyiv timezone
  const dateStr = weekStartInput.includes("T") ? weekStartInput : `${weekStartInput}T00:00:00`;
  const parsedDateKyiv = toZonedTime(new Date(dateStr), KYIV_TIMEZONE);

  // Normalize to Monday of that week (weekStartsOn: 1 = Monday)
  const mondayKyiv = startOfWeek(parsedDateKyiv, { weekStartsOn: 1 });
  const nextMondayKyiv = addWeeks(mondayKyiv, 1);

  const weekStartUtc = fromZonedTime(mondayKyiv, KYIV_TIMEZONE);
  const weekEndUtc = fromZonedTime(nextMondayKyiv, KYIV_TIMEZONE);

  // Format normalized Monday as YYYY-MM-DD
  const year = mondayKyiv.getFullYear();
  const month = String(mondayKyiv.getMonth() + 1).padStart(2, "0");
  const day = String(mondayKyiv.getDate()).padStart(2, "0");
  const normalizedMondayKyiv = `${year}-${month}-${day}`;

  return { weekStartUtc, weekEndUtc, normalizedMondayKyiv };
}

/**
 * Checks whether UTC start and end timestamps fall strictly within
 * office working hours (09:00 to 19:00) in Europe/Kyiv time.
 */
export function isWithinKyivOfficeHours(startTimeUtc: Date, endTimeUtc: Date): boolean {
  const startKyiv = toZonedTime(startTimeUtc, KYIV_TIMEZONE);
  const endKyiv = toZonedTime(endTimeUtc, KYIV_TIMEZONE);

  const startHour = getHours(startKyiv);
  const startMin = getMinutes(startKyiv);
  const endHour = getHours(endKyiv);
  const endMin = getMinutes(endKyiv);

  // Start must be >= 09:00
  const startInMins = startHour * 60 + startMin;
  const officeStartInMins = OFFICE_START_HOUR * 60; // 540 mins
  if (startInMins < officeStartInMins) return false;

  // End must be <= 19:00
  const endInMins = endHour * 60 + endMin;
  const officeEndInMins = OFFICE_END_HOUR * 60;   // 1140 mins
  if (endInMins > officeEndInMins) return false;

  // Both must be on the same calendar day in Kyiv time
  const isSameDay =
    startKyiv.getFullYear() === endKyiv.getFullYear() &&
    startKyiv.getMonth() === endKyiv.getMonth() &&
    startKyiv.getDate() === endKyiv.getDate();

  return isSameDay;
}
