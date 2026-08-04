"use client";

import React, { useState } from "react";
import ScheduleGrid, { Booking } from "@/components/ScheduleGrid";
import { BookingModal } from "@/components/BookingModal";
import { CancelModal } from "@/components/CancelModal";
import { EmailVerificationBarrier } from "@/components/EmailVerificationBarrier";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pendingSlot, setPendingSlot] = useState<{
    timeIso: string;
    roomId: string;
    roomName: string;
  } | null>(null);

  const [pendingCancelBooking, setPendingCancelBooking] = useState<{
    booking: Booking;
    roomName: string;
  } | null>(null);

  const [refetchKey, setRefetchKey] = useState<number>(0);

  const handleSlotClick = (timeIso: string, roomId: string, roomName: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingSlot({ timeIso, roomId, roomName });
  };

  const handleBookingClick = (booking: Booking, roomName: string) => {
    setPendingCancelBooking({ booking, roomName });
  };

  const handleOperationSuccess = () => {
    setPendingSlot(null);
    setPendingCancelBooking(null);
    setRefetchKey((prev) => prev + 1); // Trigger automatic grid refetch
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
      <div className="max-w-[1400px] mx-auto space-y-6">
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
                className={`w-2 h-2 rounded-full ${
                  user.isEmailVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              ></div>
              <span className="text-sm font-medium text-slate-700">{user.email}</span>
            </div>
          )}
        </div>

        {/* Global Warning Banner for Unverified Users */}
        {user && !user.isEmailVerified && (
          <div className="mb-4">
            <EmailVerificationBarrier />
          </div>
        )}

        {/* Schedule Grid Component */}
        <ScheduleGrid
          onSlotClick={handleSlotClick}
          onBookingClick={handleBookingClick}
          refetchKey={refetchKey}
        />
      </div>

      {/* Booking Creation Modal */}
      {pendingSlot && (
        <BookingModal
          slotTimeIso={pendingSlot.timeIso}
          roomId={pendingSlot.roomId}
          roomName={pendingSlot.roomName}
          onClose={() => setPendingSlot(null)}
          onSuccess={handleOperationSuccess}
        />
      )}

      {/* Booking Cancellation Modal */}
      {pendingCancelBooking && (
        <CancelModal
          booking={pendingCancelBooking.booking}
          roomName={pendingCancelBooking.roomName}
          onClose={() => setPendingCancelBooking(null)}
          onSuccess={handleOperationSuccess}
        />
      )}
    </main>
  );
}
