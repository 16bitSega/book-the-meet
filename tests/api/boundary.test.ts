import { describe, it, expect } from "vitest";
import { getKyivWeekBounds, isWithinKyivOfficeHours } from "../../src/lib/timezone";
import { isValidDuration, is30MinAligned } from "../../src/lib/interval";
import { fromZonedTime } from "date-fns-tz";

describe("API Boundary & Validation Rules Suite (BND-01..15)", () => {
  it("BND-01: Exact Kyiv opening time slot (09:00 - 09:30 Kyiv) -> Allowed", () => {
    const startUtc = fromZonedTime("2026-08-04 09:00:00", "Europe/Kyiv");
    const endUtc = fromZonedTime("2026-08-04 09:30:00", "Europe/Kyiv");

    expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(true);
    expect(is30MinAligned(startUtc)).toBe(true);
    expect(isValidDuration(startUtc, endUtc)).toBe(true);
  });

  it("BND-02 & BND-03: Exact Kyiv closing slot (18:30 - 19:00 Kyiv) -> Allowed", () => {
    const startUtc = fromZonedTime("2026-08-04 18:30:00", "Europe/Kyiv");
    const endUtc = fromZonedTime("2026-08-04 19:00:00", "Europe/Kyiv");

    expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(true);
    expect(isValidDuration(startUtc, endUtc)).toBe(true);
  });

  it("BND-04: Exceeding closing time (18:30 - 19:30 Kyiv) -> Rejects OUTSIDE_OFFICE_HOURS", () => {
    const startUtc = fromZonedTime("2026-08-04 18:30:00", "Europe/Kyiv");
    const endUtc = fromZonedTime("2026-08-04 19:30:00", "Europe/Kyiv");

    expect(isWithinKyivOfficeHours(startUtc, endUtc)).toBe(false);
  });

  it("BND-06 & BND-07: End before start or equal start/end -> Rejects INVALID_DURATION", () => {
    const startUtc = new Date("2026-08-04T11:00:00.000Z");
    const endUtc = new Date("2026-08-04T10:00:00.000Z");

    expect(isValidDuration(startUtc, endUtc)).toBe(false);
    expect(isValidDuration(startUtc, startUtc)).toBe(false);
  });

  it("BND-08 & BND-09: Duration < 30m or > 4h -> Rejects INVALID_DURATION", () => {
    const startUtc = new Date("2026-08-04T10:00:00.000Z");
    const duration15m = new Date("2026-08-04T10:15:00.000Z");
    const duration4h30m = new Date("2026-08-04T14:30:00.000Z");

    expect(isValidDuration(startUtc, duration15m)).toBe(false);
    expect(isValidDuration(startUtc, duration4h30m)).toBe(false);
  });

  it("BND-10: Non-30-minute alignment (10:15 - 10:45) -> Rejects UNALIGNED_TIME_SLOT", () => {
    const unalignedStart = new Date("2026-08-04T10:15:00.000Z");
    expect(is30MinAligned(unalignedStart)).toBe(false);
  });

  it("BND-14: Non-Monday weekStart input date -> Auto-normalizes to Monday Kyiv", () => {
    const wednesdayInput = "2026-08-05"; // Wednesday
    const { normalizedMondayKyiv } = getKyivWeekBounds(wednesdayInput);

    expect(normalizedMondayKyiv).toBe("2026-08-03"); // Monday
  });
});
