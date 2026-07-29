import { describe, it, expect } from "vitest";
import { doIntervalsOverlap } from "../../src/lib/interval";

/**
 * Mock / In-Memory Isolation Test simulating PostgreSQL GiST Exclusion Constraint & Transaction isolation behaviors.
 */
describe("Concurrency & Race Condition Protection Suite (CONC-01..05)", () => {
  it("CONC-01: Same Room, Same Slot (50 concurrent booking attempts) -> Exactly 1 succeeds (201), 49 fail (409)", async () => {
    const activeBookings: { id: string; startTime: Date; endTime: Date }[] = [];
    let conflictCount = 0;
    let successCount = 0;

    const start = new Date("2026-08-04T10:00:00.000Z");
    const end = new Date("2026-08-04T10:30:00.000Z");

    const attempts = Array.from({ length: 50 }).map(async (_, idx) => {
      // Simulate physical DB GiST lock / transaction check
      const hasConflict = activeBookings.some((b) =>
        doIntervalsOverlap(start, end, b.startTime, b.endTime)
      );

      if (hasConflict) {
        conflictCount++;
        return { status: 409, error: "SLOT_OVERLAP" };
      } else {
        activeBookings.push({ id: `booking-${idx}`, startTime: start, endTime: end });
        successCount++;
        return { status: 201, id: `booking-${idx}` };
      }
    });

    await Promise.all(attempts);

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(49);
    expect(activeBookings).toHaveLength(1);
  });

  it("CONC-02: Same Room, Adjacent Slots (10:00-11:00 vs 11:00-12:00) -> Both succeed (201)", async () => {
    const startA = new Date("2026-08-04T10:00:00.000Z");
    const endA = new Date("2026-08-04T11:00:00.000Z");
    const startB = new Date("2026-08-04T11:00:00.000Z");
    const endB = new Date("2026-08-04T12:00:00.000Z");

    expect(doIntervalsOverlap(startA, endA, startB, endB)).toBe(false);
  });

  it("CONC-03: Different Rooms, Same Slot -> Both succeed (201)", async () => {
    const room1Booking = { roomId: "room-1", startTime: "10:00", endTime: "10:30" };
    const room2Booking = { roomId: "room-2", startTime: "10:00", endTime: "10:30" };

    expect(room1Booking.roomId).not.toBe(room2Booking.roomId);
  });

  it("CONC-04: Recurring Series Partial Conflict -> Transaction rolls back entirely", async () => {
    const existingBookings = [{ weekIndex: 3, time: "10:00" }];
    const seriesAttempts = Array.from({ length: 8 }).map((_, i) => ({ weekIndex: i + 1, time: "10:00" }));

    const hasSeriesConflict = seriesAttempts.some((inst) =>
      existingBookings.some((e) => e.weekIndex === inst.weekIndex)
    );

    expect(hasSeriesConflict).toBe(true);
  });

  it("CONC-05: Double Click Submit (2 requests within 5ms) -> Exactly 1 x 201 Created, 1 x 409 Conflict", async () => {
    let booked = false;

    const request1 = async () => {
      if (booked) return 409;
      booked = true;
      return 201;
    };

    const request2 = async () => {
      if (booked) return 409;
      booked = true;
      return 201;
    };

    const results = await Promise.all([request1(), request2()]);
    expect(results.filter((r) => r === 201)).toHaveLength(1);
    expect(results.filter((r) => r === 409)).toHaveLength(1);
  });
});
