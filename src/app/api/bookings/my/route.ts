import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "upcoming"; // "upcoming" | "past"
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "10", 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50); // Capped at 50

  const now = new Date();

  const whereClause =
    tab === "upcoming"
      ? {
          userId: currentUser.id,
          status: "ACTIVE" as const,
          startTime: { gte: now },
        }
      : {
          userId: currentUser.id,
          OR: [{ startTime: { lt: now } }, { status: "CANCELLED" as const }],
        };

  const orderBy =
    tab === "upcoming"
      ? ({ startTime: "asc" } as const)
      : ({ startTime: "desc" } as const);

  const totalItems = await prisma.booking.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      room: { select: { name: true } },
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  const formattedBookings = bookings.map((b) => ({
    id: b.id,
    title: b.title,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    roomId: b.roomId,
    roomName: b.room.name,
    userId: b.userId,
    userName: currentUser.name,
    isMine: true,
    recurringSeriesId: b.recurringSeriesId,
    recurrenceIndex: b.recurrenceIndex,
  }));

  return NextResponse.json({
    bookings: formattedBookings,
    data: formattedBookings,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  });
}
