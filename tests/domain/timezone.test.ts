import { describe, it, expect } from "vitest";
import { getKyivWeekBounds, isWithinKyivOfficeHours } from "../../src/lib/timezone";
import { fromZonedTime } from "date-fns-tz";

describe("Kyiv Timezone & DST Engine Unit Tests", () => {
  it("should normalize any weekStart input date to Monday 00:00:00 Kyiv time", () => {
    // Input Wednesday 2026-08-05
    const { normalizedMondayKyiv, weekStartUtc, weekEndUtc } = getKyivWeekBounds("2026-08-05");

    expect(normalizedMondayKyiv).toBe("2026-08-03"); // Monday Aug 3
    expect(weekStartUtc.toISOString()).toBe("2026-08-02T21:00:00.000Z"); // Kyiv UTC+3 -> 00:00 Kyiv = 21:00 UTC previous day
    expect(weekEndUtc.toISOString()).toBe("2026-08-09T21:00:00.000Z");   // Next Monday 00:00 Kyiv
  });

  it("should accept bookings strictly within 09:00 to 19:00 Kyiv working hours", () => {
    // 09:00 Kyiv = 06:00 UTC in summer (UTC+3)
    const startUtc = new Date("2026-08-04T06:00:00.000Z"); // 09:00 Kyiv
    const endUtc = new Date("2026-08-04T16:00:00.000Z");   // 19:00 Kyiv

    expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(true);
  });

  it("should reject bookings starting before 09:00 Kyiv or ending after 19:00 Kyiv", () => {
    const earlyStartUtc = new Date("2026-08-04T05:30:00.000Z"); // 08:30 Kyiv
    const validEndUtc = new Date("2026-08-04T07:00:00.000Z");   // 10:00 Kyiv

    expect(isWithinKyivOfficeHours(earlyStartUtc, validEndUtc)).toBe(false);

    const validStartUtc = new Date("2026-08-04T15:00:00.000Z"); // 18:00 Kyiv
    const lateEndUtc = new Date("2026-08-04T16:30:00.000Z");    // 19:30 Kyiv

    expect(isWithinKyivOfficeHours(validStartUtc, lateEndUtc)).toBe(false);
  });

  describe("DST Shift Transition QA Scenarios (2026)", () => {
    it("Spring Forward DST Week (March 29, 2026: UTC+2 -> UTC+3)", () => {
      // 09:00 Kyiv on March 30, 2026 (after DST shift)
      const startUtc = fromZonedTime("2026-03-30 09:00:00", "Europe/Kyiv");
      const endUtc = fromZonedTime("2026-03-30 10:00:00", "Europe/Kyiv");

      expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(true);
      expect(startUtc.toISOString()).toBe("2026-03-30T06:00:00.000Z"); // UTC+3
    });

    it("Fall Back DST Week (October 25, 2026: UTC+3 -> UTC+2)", () => {
      // 09:00 Kyiv on October 26, 2026 (after Fall Back)
      const startUtc = fromZonedTime("2026-10-26 09:00:00", "Europe/Kyiv");
      const endUtc = fromZonedTime("2026-10-26 10:00:00", "Europe/Kyiv");

      expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(true);
      expect(startUtc.toISOString()).toBe("2026-10-26T07:00:00.000Z"); // UTC+2
    });
  });
});
