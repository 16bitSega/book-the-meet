"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, addWeeks, subWeeks, startOfWeek, isSameDay, addDays, setHours, setMinutes } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";

// Constants
const KYIV_TIMEZONE = "Europe/Kyiv";
const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 19;
const SLOT_DURATION_MINUTES = 30;
const TOTAL_SLOTS = ((OFFICE_END_HOUR - OFFICE_START_HOUR) * 60) / SLOT_DURATION_MINUTES;
const API_BASE = "https://full-spiders-battle.loca.lt";

// Types
export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  userName: string;
  roomId: string;
  title?: string;
}

interface ScheduleGridProps {
  onSlotClick: (startTimeIso: string, roomId: string, roomName: string) => void;
  onBookingClick: (booking: Booking, roomName: string) => void;
  refetchKey?: number;
}

export default function ScheduleGrid({
  onSlotClick,
  onBookingClick,
  refetchKey = 0,
}: ScheduleGridProps) {
  const { user, loading: authLoading } = useAuth();

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    return startOfWeek(nowKyiv, { weekStartsOn: 1 });
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Fetch Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms`, {
          headers: { "Bypass-Tunnel-Reminder": "true", "X-Requested-With": "XMLHttpRequest" },
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          if (data.length > 0 && !selectedRoomId) {
            setSelectedRoomId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    fetchRooms();
  }, [selectedRoomId]);

  // Fetch Bookings whenever week, room, or refetchKey changes
  const fetchBookings = useCallback(async () => {
    if (!selectedRoomId) return;

    setIsLoading(true);
    try {
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      const url = `${API_BASE}/api/bookings?roomId=${selectedRoomId}&weekStart=${weekStartStr}`;

      const res = await fetch(url, {
        headers: { "Bypass-Tunnel-Reminder": "true", "X-Requested-With": "XMLHttpRequest" },
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart, selectedRoomId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, refetchKey]);

  // Derived Dates
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: TOTAL_SLOTS }).map(
      (_, i) => OFFICE_START_HOUR * 60 + i * SLOT_DURATION_MINUTES
    );
  }, []);

  // Handlers
  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const handleToday = () => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    setCurrentWeekStart(startOfWeek(nowKyiv, { weekStartsOn: 1 }));
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  // Cell Logic
  const getBookingForCell = useCallback(
    (dayDate: Date, startMinutes: number) => {
      const hours = Math.floor(startMinutes / 60);
      const mins = startMinutes % 60;

      const slotStartKyiv = setMinutes(setHours(dayDate, hours), mins);
      const slotStartIso = formatInTimeZone(slotStartKyiv, KYIV_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const slotStartTime = new Date(slotStartIso).getTime();

      return bookings.find((b) => {
        if (b.roomId !== selectedRoomId) return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return slotStartTime >= bStart && slotStartTime < bEnd;
      });
    },
    [bookings, selectedRoomId]
  );

  const formatTimeLabel = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  if (authLoading || !rooms.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors">
            ←
          </button>
          <span className="font-semibold text-slate-800 min-w-[140px] text-center text-sm">
            {format(currentWeekStart, "MMM dd, yyyy")}
          </span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors">
            →
          </button>
          <button
            onClick={handleToday}
            className="ml-2 px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-800 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-xs"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Fl. {r.floor}, Cap. {r.capacity})
              </option>
            ))}
          </select>

          <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hidden md:block">
            <span className="font-bold">Kyiv Time</span> (UTC+2/3)
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-slate-100/70">
            <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Time</div>
            {weekDays.map((day, i) => {
              const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
              const isToday = isSameDay(nowKyiv, day);
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-l border-slate-200 ${isToday ? "bg-blue-50 text-blue-800 font-bold" : ""}`}
                >
                  <div className="text-xs font-bold uppercase text-slate-500">{format(day, "EEE")}</div>
                  <div className={`text-sm font-bold mt-1 ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                    {format(day, "dd MMM")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="relative divide-y divide-slate-100">
            {isLoading ? (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : null}

            {timeSlots.map((minutes) => (
              <div
                key={minutes}
                className="grid grid-cols-[60px_repeat(7,1fr)] hover:bg-slate-50/50 transition-colors"
              >
                {/* Time Label */}
                <div className="p-2 text-xs text-slate-500 text-right pr-3 border-r border-slate-100 bg-slate-50/50 sticky left-0 font-mono">
                  {formatTimeLabel(minutes)}
                </div>

                {/* Cells */}
                {weekDays.map((day, dayIdx) => {
                  const booking = getBookingForCell(day, minutes);
                  const isMyBooking = booking?.userId === user?.id;

                  let cellContent = null;
                  let cellClass = "border-l border-slate-100 p-1 relative group cursor-pointer transition-colors min-h-[44px]";

                  if (booking) {
                    cellClass = isMyBooking
                      ? "border-l border-slate-100 p-1 relative bg-blue-50/60 cursor-pointer min-h-[44px]"
                      : "border-l border-slate-100 p-1 relative bg-slate-100/60 cursor-not-allowed min-h-[44px]";

                    cellContent = (
                      <div
                        onClick={() => {
                          if (isMyBooking && currentRoom) {
                            onBookingClick(booking, currentRoom.name);
                          }
                        }}
                        className={`h-full w-full rounded-md text-xs p-1.5 flex flex-col justify-center shadow-xs transition-all ${
                          isMyBooking
                            ? "bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                            : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        <span className="font-bold truncate leading-tight">
                          {booking.title || "Meeting"}
                        </span>
                        <span className="text-[10px] opacity-80 mt-0.5 truncate">
                          {isMyBooking ? "My Booking (Click to cancel)" : booking.userName}
                        </span>
                      </div>
                    );
                  } else {
                    // Available
                    cellContent = (
                      <div
                        onClick={() => {
                          const slotStartKyiv = setMinutes(
                            setHours(day, Math.floor(minutes / 60)),
                            minutes % 60
                          );
                          const utcIso = formatInTimeZone(
                            slotStartKyiv,
                            KYIV_TIMEZONE,
                            "yyyy-MM-dd'T'HH:mm:ssXXX"
                          );
                          if (currentRoom) {
                            onSlotClick(utcIso, selectedRoomId, currentRoom.name);
                          }
                        }}
                        className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-blue-50/50 rounded-md border border-dashed border-blue-400"
                      >
                        <span className="text-xs font-semibold text-blue-600">+ Book</span>
                      </div>
                    );
                  }

                  return (
                    <div key={dayIdx} className={cellClass}>
                      {cellContent}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
