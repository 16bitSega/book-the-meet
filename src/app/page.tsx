"use client";

import React, { useState, useEffect, useCallback } from "react";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingModal from "@/components/BookingModal";
import CancelModal from "@/components/CancelModal";
import { EmailVerificationBarrier } from "@/components/EmailVerificationBarrier";
import { NotificationToast } from "@/components/NotificationToast";
import { GridSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Office Schedule</h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time booking for Kyiv Office (Europe/Kyiv)
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  user.isEmailVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              ></div>
              <span className="text-sm font-medium text-slate-700">{user.email}</span>
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
                className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
              >
                Retry
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
