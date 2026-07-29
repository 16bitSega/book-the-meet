import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const minCapacity = searchParams.get("capacity");

  const whereClause: { capacity?: { gte: number } } = {};
  if (minCapacity && !isNaN(Number(minCapacity))) {
    whereClause.capacity = { gte: Number(minCapacity) };
  }

  const rooms = await prisma.room.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(rooms);
}
