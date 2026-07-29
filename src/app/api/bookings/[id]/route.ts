import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateCsrf, checkRateLimit } from "@/lib/middleware";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. CSRF Origin Validation
  if (!validateCsrf(req)) {
    return NextResponse.json(
      { error: "CSRF_VALIDATION_FAILED", message: "Invalid Origin or Referer header." },
      { status: 403 }
    );
  }

  // 2. Auth Check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 }
    );
  }

  // 3. Rate Limit Check (10 req/min)
  if (!checkRateLimit(`booking_delete:${currentUser.id}`, 10)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many cancellation requests. Please try again later." },
      { status: 429 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "single"; // "single" | "series"

  // 4. Resource Existence Check
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "BOOKING_NOT_FOUND", message: "Booking not found." },
      { status: 404 }
    );
  }

  // 5. Ownership Check
  if (booking.userId !== currentUser.id) {
    return NextResponse.json(
      { error: "NOT_BOOKING_OWNER", message: "You can only cancel your own bookings." },
      { status: 403 }
    );
  }

  // 6. Future Time Check (Cannot cancel past bookings)
  if (booking.startTime.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "CANNOT_CANCEL_PAST_BOOKING", message: "Past bookings cannot be cancelled." },
      { status: 400 }
    );
  }

  const now = new Date();

  if (mode === "series" && booking.recurringSeriesId) {
    // Cancel all future bookings in the recurring series
    await prisma.booking.updateMany({
      where: {
        recurringSeriesId: booking.recurringSeriesId,
        userId: currentUser.id,
        status: "ACTIVE",
        startTime: { gte: now },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledByUserId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Recurring series successfully cancelled." });
  }

  // Cancel single booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancelledByUserId: currentUser.id,
    },
  });

  return NextResponse.json({ message: "Booking successfully cancelled." });
}
