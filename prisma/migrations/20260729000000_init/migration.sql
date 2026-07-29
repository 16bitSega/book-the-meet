-- 1. Enable required PostgreSQL extensions FIRST
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Create Enum
CREATE TYPE "BookingStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- 3. Create Tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationTokenHash" TEXT,
    "verificationTokenExpires" TIMESTAMPTZ(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "endTime" TIMESTAMPTZ(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMPTZ(3),
    "cancelledByUserId" TEXT,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recurringSeriesId" TEXT,
    "recurrenceIndex" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- 4. Unique Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_verificationTokenHash_key" ON "users"("verificationTokenHash");
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");
CREATE UNIQUE INDEX "notification_delivery_logs_bookingId_userId_key" ON "notification_delivery_logs"("bookingId", "userId");

-- 5. Query Performance Indexes
CREATE INDEX "bookings_roomId_startTime_idx" ON "bookings"("roomId", "startTime");
CREATE INDEX "bookings_userId_startTime_idx" ON "bookings"("userId", "startTime");
CREATE INDEX "bookings_recurringSeriesId_idx" ON "bookings"("recurringSeriesId");

-- 6. Foreign Key Constraints
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Partial Exclusion Constraint: Only ACTIVE bookings must not overlap
ALTER TABLE "bookings"
ADD CONSTRAINT "no_overlapping_bookings"
EXCLUDE USING gist (
  "roomId" WITH =,
  tstzrange("startTime", "endTime", '[)') WITH &&
) WHERE ("status" = 'ACTIVE');

-- 8. Cancellation Consistency Check
ALTER TABLE "bookings"
ADD CONSTRAINT "booking_cancellation_consistency"
CHECK (
  ("status" = 'ACTIVE' AND "cancelledAt" IS NULL AND "cancelledByUserId" IS NULL) OR
  ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "cancelledByUserId" IS NOT NULL)
);

-- 9. Entity Field Bounds Checks
ALTER TABLE "rooms" ADD CONSTRAINT "room_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "users" ADD CONSTRAINT "user_name_length" CHECK (length(trim("name")) BETWEEN 1 AND 50);
ALTER TABLE "bookings" ADD CONSTRAINT "booking_title_length" CHECK (length(trim("title")) BETWEEN 1 AND 100);

-- 10. Start before End Check
ALTER TABLE "bookings"
ADD CONSTRAINT "booking_start_before_end"
CHECK ("startTime" < "endTime");

-- 11. Booking Duration Bounds Check (30 mins <= duration <= 4 hours)
ALTER TABLE "bookings"
ADD CONSTRAINT "booking_duration_bounds"
CHECK (
  "endTime" - "startTime" >= INTERVAL '30 minutes' AND
  "endTime" - "startTime" <= INTERVAL '4 hours'
);

-- 12. Session-Independent 30-Minute Granularity Alignment Check
ALTER TABLE "bookings"
ADD CONSTRAINT "booking_30min_alignment"
CHECK (
  EXTRACT(MINUTE FROM ("startTime" AT TIME ZONE 'UTC')) IN (0, 30) AND
  EXTRACT(SECOND FROM ("startTime" AT TIME ZONE 'UTC')) = 0 AND
  EXTRACT(MINUTE FROM ("endTime" AT TIME ZONE 'UTC')) IN (0, 30) AND
  EXTRACT(SECOND FROM ("endTime" AT TIME ZONE 'UTC')) = 0
);
