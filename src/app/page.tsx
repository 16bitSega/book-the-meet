"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingModal from "@/components/BookingModal";
import CancelModal from "@/components/CancelModal";
import { EmailVerificationBarrier } from "@/components/EmailVerificationBarrier";
import { NotificationToast } from "@/components/NotificationToast";
import { GridSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isSameDay, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Types
interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  userName: string;
  roomId: string;
  title: string;
  recurringSeriesId?: string | null;
}

const KYIV_TIMEZONE = "Europe/Kyiv";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [pendingSlot, setPendingSlot] = useState<{ time: string; roomId: string } | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<{ id: string; hasSeries: boolean } | null>(null);

  // Fetch My Bookings for notification system and grid sync
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/my?tab=upcoming&limit=50`, {
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      } else {
        setApiError("Failed to load your bookings");
      }
    } catch {
      setApiError("Network error. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
    else setIsLoading(false);
  }, [user, fetchBookings]);

  // Find user's meeting for today
  const todayMeeting = useMemo(() => {
    if (!user || !bookings || bookings.length === 0) return null;
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);

    return bookings.find((b) => {
      const bStartKyiv = toZonedTime(new Date(b.startTime), KYIV_TIMEZONE);
      return isSameDay(nowKyiv, bStartKyiv);
    });
  }, [user, bookings]);

  const handleSlotClick = (timeIso: string, roomId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingSlot({ time: timeIso, roomId });
  };

  const handleCancelClick = (id: string, hasSeries: boolean) => {
    setCancellingBooking({ id, hasSeries });
  };

  const handleRefresh = () => {
    fetchBookings();
    setPendingSlot(null);
    setCancellingBooking(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-mint-cream)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-frozen-water)] border-t-[var(--color-jungle-teal)]"></div>
          <p className="text-[var(--color-jungle-teal)] font-medium animate-pulse">Loading Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-mint-cream)] p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-white rounded-2xl shadow-xs border border-[var(--color-frozen-water)]">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-jungle-teal)] tracking-tight">Office Schedule</h1>
            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
              Reserve meeting spaces in our Kyiv office. All times are displayed in{" "}
              <span className="font-semibold text-[var(--color-jungle-teal)]">Kyiv Time (Europe/Kyiv)</span>.
            </p>
          </div>

          {/* Today's Reserved Meeting Alert Badge */}
          {user && (
            <div className="flex items-center gap-3 bg-[var(--color-azure-mist)] px-4 py-3 rounded-xl border border-[var(--color-frozen-water)] shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[var(--color-jungle-teal)]/15 text-[var(--color-jungle-teal)] flex items-center justify-center font-bold text-base shrink-0">
                📅
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Today's Schedule</p>
                {todayMeeting ? (
                  <p className="text-xs font-bold text-[var(--color-jungle-teal)]">
                    Your reserved meeting is today at{" "}
                    <span className="underline">
                      {format(toZonedTime(new Date(todayMeeting.startTime), KYIV_TIMEZONE), "HH:mm")}
                    </span>{" "}
                    ({todayMeeting.title || "Meeting"})
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-gray-600">No reserved meetings scheduled for today</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {apiError ? (
          <EmptyState
            title="Unable to Load Schedule"
            message={apiError}
            action={
              <button
                onClick={() => fetchBookings()}
                className="btn-primary text-xs"
              >
                Try Again
              </button>
            }
          />
        ) : isLoading ? (
          <GridSkeleton />
        ) : (
          <ScheduleGrid
            onSlotClick={handleSlotClick}
            onCancelClick={handleCancelClick}
            myBookings={bookings}
          />
        )}
      </div>

      {/* Modals & Overlays */}
      {user && !user.isEmailVerified && (
        <div className="fixed bottom-6 left-6 z-40 max-w-md">
          <EmailVerificationBarrier />
        </div>
      )}

      {pendingSlot && (
        <BookingModal
          startTimeIso={pendingSlot.time}
          roomId={pendingSlot.roomId}
          onClose={() => setPendingSlot(null)}
          onSuccess={handleRefresh}
        />
      )}

      {cancellingBooking && (
        <CancelModal
          bookingId={cancellingBooking.id}
          hasRecurringSeries={cancellingBooking.hasSeries}
          onClose={() => setCancellingBooking(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Notifications */}
      {user && <NotificationToast bookings={bookings} />}
    </main>
  );
}
