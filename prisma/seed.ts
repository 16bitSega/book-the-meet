import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, startOfWeek, setHours, setMinutes } from "date-fns";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/book_meet?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const KYIV_TZ = "Europe/Kyiv";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Rooms (using upsert for idempotency)
  const roomsData = [
    { name: "Акваріум", floor: 1, capacity: 6 },
    { name: "Марс", floor: 2, capacity: 10 },
    { name: "Гагарін", floor: 2, capacity: 4 },
    { name: "Венера", floor: 3, capacity: 8 },
    { name: "Юпітер", floor: 3, capacity: 15 },
  ];

  const rooms = [];
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { name: r.name },
      update: { floor: r.floor, capacity: r.capacity },
      create: r,
    });
    rooms.push(room);
  }
  console.log(`✅ Seeded ${rooms.length} rooms.`);

  // 2. Seed Test Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@office.com" },
    update: { isEmailVerified: true, name: "Admin User" },
    create: {
      email: "admin@office.com",
      name: "Admin User",
      passwordHash,
      isEmailVerified: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "user@office.com" },
    update: { isEmailVerified: true, name: "Test User" },
    create: {
      email: "user@office.com",
      name: "Test User",
      passwordHash,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Seeded test users: admin@office.com & user@office.com`);

  // 3. Seed Relative-Date Demo Bookings
  // Calculate relative dates for current week Monday & Tuesday in Kyiv
  const nowKyiv = toZonedTime(new Date(), KYIV_TZ);
  const mondayKyiv = startOfWeek(nowKyiv, { weekStartsOn: 1 });
  const tuesdayKyiv = addDays(mondayKyiv, 1);
  const wednesdayKyiv = addDays(mondayKyiv, 2);

  // Convert 10:00 - 11:30 Kyiv time on Tuesday to UTC
  const slot1Start = fromZonedTime(setMinutes(setHours(tuesdayKyiv, 10), 0), KYIV_TZ);
  const slot1End = fromZonedTime(setMinutes(setHours(tuesdayKyiv, 11), 30), KYIV_TZ);

  // Convert 14:00 - 15:00 Kyiv time on Wednesday to UTC
  const slot2Start = fromZonedTime(setMinutes(setHours(wednesdayKyiv, 14), 0), KYIV_TZ);
  const slot2End = fromZonedTime(setMinutes(setHours(wednesdayKyiv, 15), 0), KYIV_TZ);

  // Clear demo bookings for clean seed
  await prisma.booking.deleteMany({
    where: {
      title: { in: ["Weekly Team Sync", "Project Sprint Planning"] },
    },
  });

  await prisma.booking.create({
    data: {
      title: "Weekly Team Sync",
      startTime: slot1Start,
      endTime: slot1End,
      status: "ACTIVE",
      roomId: rooms[0].id, // Акваріум
      userId: adminUser.id,
    },
  });

  await prisma.booking.create({
    data: {
      title: "Project Sprint Planning",
      startTime: slot2Start,
      endTime: slot2End,
      status: "ACTIVE",
      roomId: rooms[1].id, // Марс
      userId: testUser.id,
    },
  });

  console.log(`✅ Seeded demo bookings.`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
