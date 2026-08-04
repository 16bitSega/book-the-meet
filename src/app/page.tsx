"use client";

import React, { useState } from "react";
import ScheduleGrid from "@/components/ScheduleGrid";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { addMinutes } from "date-fns";

const API_BASE = "https://full-spiders-battle.loca.lt";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pendingSlot, setPendingSlot] = useState<{ time: string; roomId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlotClick = (timeIso: string, roomId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingSlot({ time: timeIso, roomId });
    setError(null);
  };

  const handleCloseModal = () => {
    setPendingSlot(null);
    setError(null);
  };

  const handleConfirmBooking = async () => {
    if (!pendingSlot || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const startTime = pendingSlot.time;
      const endTime = formatInTimeZone(
        addMinutes(new Date(startTime), 30),
        "Europe/Kyiv",
        "yyyy-MM-dd'T'HH:mm:ssXXX"
      );

      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          roomId: pendingSlot.roomId,
          title: "Team Sync", // Default title
          startTime,
          endTime,
          isRecurring: false,
        }),
      });

      if (res.status === 409) {
        setError("This slot was just booked by someone else. Please refresh.");
        setTimeout(() => handleCloseModal(), 2000);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to book");
      }

      // Success
      handleCloseModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
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
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-xs border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">{user.email}</span>
            </div>
          )}
        </div>

        {/* Grid Component */}
        <ScheduleGrid onSlotClick={handleSlotClick} />
      </div>

      {/* Booking Confirmation Modal */}
      {pendingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Confirm Booking</h3>
            <p className="text-slate-500 text-sm mb-6">You are about to book this slot.</p>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2 border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Start Time:</span>
                <span className="font-mono font-medium text-slate-800">
                  {new Date(pendingSlot.time).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">End Time:</span>
                <span className="font-mono font-medium text-slate-800">
                  {new Date(new Date(pendingSlot.time).getTime() + 30 * 60000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Room ID:</span>
                <span className="font-mono font-medium text-slate-800 truncate max-w-[200px]">
                  {pendingSlot.roomId}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
