"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ScheduleGrid, { Booking, Room } from "@/components/ScheduleGrid";
import { useAuth } from "@/context/AuthContext";

const KYIV_TIMEZONE = "Europe/Kyiv";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    return startOfWeek(nowKyiv, { weekStartsOn: 1 });
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [pendingSlot, setPendingSlot] = useState<{ timeIso: string; roomId: string } | null>(null);

  // Fetch Rooms on Mount
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          if (data.length > 0) {
            setSelectedRoomId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    }
    fetchRooms();
  }, []);

  // Fetch Bookings when room or week changes
  const fetchBookings = useCallback(async () => {
    if (!selectedRoomId) return;

    setLoadingData(true);
    try {
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      const res = await fetch(
        `/api/bookings?roomId=${selectedRoomId}&weekStart=${weekStartStr}`
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedRoomId, currentWeekStart]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSlotClick = (timeIso: string, roomId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingSlot({ timeIso, roomId });
  };

  const handleCloseModal = () => {
    setPendingSlot(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Office Meeting Schedule
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Select room and time slot to create a reservation (Kyiv Office Hours: 09:00 - 19:00)
            </p>
          </div>
          {user && (
            <div className="text-xs text-slate-700 bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200">
              Logged in as: <span className="font-semibold text-blue-700">{user.email}</span>
            </div>
          )}
        </div>

        {/* Schedule Grid Component */}
        {loadingData && rooms.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-white p-8 border border-slate-200">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-xs font-medium text-slate-500">Loading schedule grid...</p>
            </div>
          </div>
        ) : (
          <ScheduleGrid
            bookings={bookings}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onRoomChange={setSelectedRoomId}
            currentWeekStart={currentWeekStart}
            onWeekChange={setCurrentWeekStart}
            onSlotClick={handleSlotClick}
          />
        )}

        {/* Slot Selection Modal Placeholder (Release 3.3 Interactive Modal) */}
        {pendingSlot && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Create Reservation</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Slot (UTC):
                  </span>
                  <div className="mt-1 font-mono text-xs bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all">
                    {pendingSlot.timeIso}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Room:
                  </span>
                  <div className="mt-1 text-sm font-medium text-slate-800">
                    {rooms.find((r) => r.id === pendingSlot.roomId)?.name || "Selected Room"}
                  </div>
                </div>

                {!user?.isEmailVerified && (
                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800">
                    ⚠️ Your email is unverified. Please verify your email before creating bookings.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Interactive booking modal form will be implemented in Release 3.3!");
                    handleCloseModal();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Confirm Slot Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
