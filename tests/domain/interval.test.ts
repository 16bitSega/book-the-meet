import { describe, it, expect } from "vitest";
import { doIntervalsOverlap, isValidDuration, is30MinAligned } from "../../src/lib/interval";

describe("Interval Collision Engine Unit Tests [Half-Open Ranges]", () => {
  const t10_00 = new Date("2026-08-04T10:00:00.000Z");
  const t10_30 = new Date("2026-08-04T10:30:00.000Z");
  const t11_00 = new Date("2026-08-04T11:00:00.000Z");
  const t11_30 = new Date("2026-08-04T11:30:00.000Z");
  const t12_00 = new Date("2026-08-04T12:00:00.000Z");

  it("1. Exact Match [10:00, 11:00) vs [10:00, 11:00) -> Collides", () => {
    expect(doIntervalsOverlap(t10_00, t11_00, t10_00, t11_00)).toBe(true);
  });

  it("2. Partial Enclosure [10:30, 11:00) vs [10:00, 11:30) -> Collides", () => {
    expect(doIntervalsOverlap(t10_30, t11_00, t10_00, t11_30)).toBe(true);
  });

  it("3. Overlapping Start [09:30, 10:30) vs [10:00, 11:00) -> Collides", () => {
    const t09_30 = new Date("2026-08-04T09:30:00.000Z");
    expect(doIntervalsOverlap(t09_30, t10_30, t10_00, t11_00)).toBe(true);
  });

  it("4. Overlapping End [10:30, 11:30) vs [10:00, 11:00) -> Collides", () => {
    expect(doIntervalsOverlap(t10_30, t11_30, t10_00, t11_00)).toBe(true);
  });

  it("5. Back-to-Back Before [09:00, 10:00) vs [10:00, 11:00) -> NO Collision (Allowed)", () => {
    const t09_00 = new Date("2026-08-04T09:00:00.000Z");
    expect(doIntervalsOverlap(t09_00, t10_00, t10_00, t11_00)).toBe(false);
  });

  it("6. Back-to-Back After [11:00, 12:00) vs [10:00, 11:00) -> NO Collision (Allowed)", () => {
    expect(doIntervalsOverlap(t11_00, t12_00, t10_00, t11_00)).toBe(false);
  });

  it("7. Completely Separate Intervals -> NO Collision", () => {
    expect(doIntervalsOverlap(t10_00, t10_30, t11_30, t12_00)).toBe(false);
  });

  describe("Duration & Alignment Checks", () => {
    it("should accept valid duration between 30 mins and 4 hours", () => {
      expect(isValidDuration(t10_00, t10_30)).toBe(true);  // 30 mins
      expect(isValidDuration(t10_00, t12_00)).toBe(true);  // 2 hours
      expect(isValidDuration(t10_00, new Date("2026-08-04T14:00:00.000Z"))).toBe(true); // 4 hours
    });

    it("should reject duration less than 30 mins or greater than 4 hours", () => {
      const t10_15 = new Date("2026-08-04T10:15:00.000Z");
      const t14_30 = new Date("2026-08-04T14:30:00.000Z");
      expect(isValidDuration(t10_00, t10_15)).toBe(false); // 15 mins
      expect(isValidDuration(t10_00, t14_30)).toBe(false); // 4h 30m
    });

    it("should validate 30-minute alignment in UTC", () => {
      expect(is30MinAligned(t10_00)).toBe(true);
      expect(is30MinAligned(t10_30)).toBe(true);
      expect(is30MinAligned(new Date("2026-08-04T10:15:00.000Z"))).toBe(false);
      expect(is30MinAligned(new Date("2026-08-04T10:00:05.000Z"))).toBe(false);
    });
  });
});
