import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addWeeks, getHours, getMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateCsrf, checkRateLimit } from "@/lib/middleware";
import { getKyivWeekBounds, isWithinKyivOfficeHours, KYIV_TIMEZONE } from "@/lib/timezone";
import { isValidDuration, is30MinAligned } from "@/lib/interval";

const createBookingSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().trim().min(1).max(100),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isRecurring: z.boolean().optional(),
  recurrenceCount: z.number().int().min(1).max(12).optional(),
});

// GET /api/bookings?roomId=&weekStart=
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const weekStart = searchParams.get("weekStart");

  if (!roomId || !weekStart) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "roomId and weekStart parameters are required." },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json(
      { error: "ROOM_NOT_FOUND", message: "Specified room does not exist." },
      { status: 404 }
    );
  }

  const { weekStartUtc, weekEndUtc, normalizedMondayKyiv } = getKyivWeekBounds(weekStart);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: "ACTIVE",
      startTime: {
        gte: weekStartUtc,
        lt: weekEndUtc,
      },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const formattedBookings = bookings.map((b) => ({
    id: b.id,
    title: b.title,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    roomId: b.roomId,
    userId: b.userId,
    userName: b.user.name,
    isMine: b.userId === user.id,
    recurringSeriesId: b.recurringSeriesId,
    recurrenceIndex: b.recurrenceIndex,
  }));

  return NextResponse.json({
    weekStart: normalizedMondayKyiv,
    bookings: formattedBookings,
  });
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  // Stage 1 & 2: CSRF & Auth Check
  if (!validateCsrf(req)) {
    return NextResponse.json(
      { error: "CSRF_VALIDATION_FAILED", message: "Invalid Origin or Referer header." },
      { status: 403 }
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 }
    );
  }

  // Stage 3: User Rate Limiting (10 req/min)
  if (!checkRateLimit(`booking_create:${currentUser.id}`, 10)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many booking creation requests. Please try again later." },
      { status: 429 }
    );
  }

  // Stage 4: Input Validation
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "Malformed JSON request body." },
      { status: 400 }
    );
  }

  const result = createBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "Validation error", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { roomId, title, startTime: startTimeStr, endTime: endTimeStr, isRecurring, recurrenceCount } = result.data;
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);

  // Validate recurring parameters
  const effectiveCount = isRecurring ? (recurrenceCount || 1) : 1;
  if (isRecurring && (effectiveCount < 2 || effectiveCount > 12)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "Recurring bookings require a recurrenceCount between 2 and 12." },
      { status: 400 }
    );
  }

  // Stage 5: Business Rules & Verification
  if (!currentUser.isEmailVerified) {
    return NextResponse.json(
      { error: "EMAIL_NOT_VERIFIED", message: "Email verification is required before creating bookings." },
      { status: 403 }
    );
  }

  if (startTime.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "BOOKING_IN_PAST", message: "Bookings must be created for future time slots." },
      { status: 400 }
    );
  }

  if (!is30MinAligned(startTime) || !is30MinAligned(endTime)) {
    return NextResponse.json(
      { error: "UNALIGNED_TIME_SLOT", message: "Booking start and end times must be aligned to 30-minute intervals." },
      { status: 400 }
    );
  }

  if (!isValidDuration(startTime, endTime)) {
    return NextResponse.json(
      { error: "INVALID_DURATION", message: "Booking duration must be between 30 minutes and 4 hours." },
      { status: 400 }
    );
  }

  if (!isWithinKyivOfficeHours(startTime, endTime)) {
    return NextResponse.json(
      { error: "OUTSIDE_OFFICE_HOURS", message: "Bookings must fall strictly within Kyiv office hours (09:00 to 19:00)." },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json(
      { error: "ROOM_NOT_FOUND", message: "Specified room does not exist." },
      { status: 404 }
    );
  }

  // Stage 6: DB Insertion & DST-Aware Recurrence Generation
  const seriesId = effectiveCount > 1 ? crypto.randomUUID() : null;

  try {
    const bookingInstances = [];

    // Calculate initial wall-clock start/end in Kyiv timezone
    const startKyiv = toZonedTime(startTime, KYIV_TIMEZONE);
    const endKyiv = toZonedTime(endTime, KYIV_TIMEZONE);

    const startH = getHours(startKyiv);
    const startM = getMinutes(startKyiv);
    const endH = getHours(endKyiv);
    const endM = getMinutes(endKyiv);

    for (let k = 0; k < effectiveCount; k++) {
      // Step k weeks forward in Kyiv wall-clock time to handle DST shifts
      const instanceStartKyiv = addWeeks(startKyiv, k);
      instanceStartKyiv.setHours(startH, startM, 0, 0);

      const instanceEndKyiv = addWeeks(endKyiv, k);
      instanceEndKyiv.setHours(endH, endM, 0, 0);

      const instStartUtc = fromZonedTime(instanceStartKyiv, KYIV_TIMEZONE);
      const instEndUtc = fromZonedTime(instanceEndKyiv, KYIV_TIMEZONE);

      bookingInstances.push({
        title,
        startTime: instStartUtc,
        endTime: instEndUtc,
        status: "ACTIVE" as const,
        roomId,
        userId: currentUser.id,
        recurringSeriesId: seriesId,
        recurrenceIndex: effectiveCount > 1 ? k + 1 : null,
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const instance of bookingInstances) {
        const item = await tx.booking.create({
          data: instance,
          include: { user: { select: { id: true, name: true } } },
        });
        results.push(item);
      }
      return results;
    });

    const firstItem = created[0];
    return NextResponse.json(
      {
        id: firstItem.id,
        title: firstItem.title,
        startTime: firstItem.startTime.toISOString(),
        endTime: firstItem.endTime.toISOString(),
        status: firstItem.status,
        roomId: firstItem.roomId,
        userId: firstItem.userId,
        userName: firstItem.user.name,
        isMine: true,
        recurringSeriesId: firstItem.recurringSeriesId,
        recurrenceIndex: firstItem.recurrenceIndex,
        createdSeriesCount: created.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Catch PostgreSQL GiST exclusion violation (23P01) or check constraint (23514)
    if (error.code === "P2010" || error.message?.includes("23P01") || error.message?.includes("no_overlapping_bookings")) {
      return NextResponse.json(
        { error: "SLOT_OVERLAP", message: "The selected time slot is already booked for this room." },
        { status: 409 }
      );
    }

    console.error("Create Booking Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to create booking." },
      { status: 500 }
    );
  }
}
