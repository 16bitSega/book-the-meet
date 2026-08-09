"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, addWeeks, subWeeks, startOfWeek, isSameDay, setHours, setMinutes, addDays, parseISO } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "./EmptyState";

// Constants
const KYIV_TIMEZONE = "Europe/Kyiv";
const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 19;
const SLOT_DURATION_MINUTES = 30;
const TOTAL_SLOTS = ((OFFICE_END_HOUR - OFFICE_START_HOUR) * 60) / SLOT_DURATION_MINUTES;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// Types
interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

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

interface ScheduleGridProps {
  onSlotClick: (startTimeIso: string, roomId: string) => void;
  onCancelClick: (id: string, hasSeries: boolean) => void;
  myBookings?: Booking[];
  bookings?: Booking[];
  rooms?: Room[];
}

export default function ScheduleGrid({
  onSlotClick,
  onCancelClick,
  rooms: initialRooms,
  bookings: initialBookings,
}: ScheduleGridProps) {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>(initialRooms || []);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings || []);
  const [isLoading, setIsLoading] = useState(!initialRooms || initialRooms.length === 0);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    return startOfWeek(nowKyiv, { weekStartsOn: 1 });
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Sync initial props if provided
  useEffect(() => {
    if (initialRooms && initialRooms.length > 0) {
      setRooms(initialRooms);
      if (!selectedRoomId) setSelectedRoomId(initialRooms[0].id);
    }
  }, [initialRooms, selectedRoomId]);

  useEffect(() => {
    if (initialBookings) {
      setBookings(initialBookings);
    }
  }, [initialBookings]);

  // Fetch Rooms if not passed
  useEffect(() => {
    if (initialRooms && initialRooms.length > 0) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms`, {
          headers: { "Bypass-Tunnel-Reminder": "true", "X-Requested-With": "XMLHttpRequest" },
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          if (data.length > 0 && !selectedRoomId) setSelectedRoomId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRooms();
  }, [initialRooms, selectedRoomId]);

  // Fetch Bookings if not passed
  useEffect(() => {
    if (!selectedRoomId) return;
    const fetchBookings = async () => {
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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [currentWeekStart, selectedRoomId]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );
  const timeSlots = useMemo(
    () => Array.from({ length: TOTAL_SLOTS }).map((_, i) => OFFICE_START_HOUR * 60 + i * SLOT_DURATION_MINUTES),
    []
  );

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const handleToday = () => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    setCurrentWeekStart(startOfWeek(nowKyiv, { weekStartsOn: 1 }));
  };

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

  if (!rooms.length) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-[var(--color-frozen-water)] overflow-hidden">
      {/* Controls Header */}
      <div className="p-5 border-b border-[var(--color-frozen-water)] bg-white flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-[var(--color-azure-mist)] rounded-full text-[var(--color-jungle-teal)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span className="font-bold text-lg text-gray-800 min-w-[160px] text-center">
            {format(currentWeekStart, "MMMM dd, yyyy")}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-[var(--color-azure-mist)] rounded-full text-[var(--color-jungle-teal)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="ml-2 px-4 py-2 text-sm font-medium bg-[var(--color-azure-mist)] text-[var(--color-jungle-teal)] rounded-lg hover:bg-[var(--color-frozen-water)] transition-colors border border-[var(--color-frozen-water)]"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full lg:w-64 appearance-none bg-white border border-[var(--color-frozen-water)] text-gray-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-jungle-teal)] focus:border-transparent font-medium cursor-pointer"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Fl. {r.floor || 1}, Cap. {r.capacity})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[var(--color-mint-cream)] px-3 py-2 rounded-lg border border-[var(--color-frozen-water)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-jungle-teal)] animate-pulse"></div>
            <span className="text-xs font-semibold text-[var(--color-jungle-teal)]">Kyiv Time</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-[var(--color-frozen-water)] bg-[var(--color-azure-mist)]/30">
            <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Time</div>
            {weekDays.map((day, i) => {
              const isToday = isSameDay(toZonedTime(new Date(), KYIV_TIMEZONE), day);
              return (
                <div
                  key={i}
                  className={`p-4 text-center border-l border-[var(--color-frozen-water)]/60 ${
                    isToday ? "bg-[var(--color-jungle-teal)]/10" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-bold uppercase mb-1 ${
                      isToday ? "text-[var(--color-jungle-teal)]" : "text-gray-500"
                    }`}
                  >
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`text-lg font-bold leading-none ${
                      isToday ? "text-[var(--color-jungle-teal)]" : "text-gray-800"
                    }`}
                  >
                    {format(day, "dd")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body Rows */}
          <div className="relative">
            {isLoading ? (
              <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--color-frozen-water)] border-t-[var(--color-jungle-teal)]"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Bookings This Week"
                  message={`Select a time slot below to book ${rooms.find((r) => r.id === selectedRoomId)?.name}.`}
                />
              </div>
            ) : null}

            {timeSlots.map((minutes) => (
              <div
                key={minutes}
                className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-gray-50 hover:bg-[var(--color-azure-mist)]/10 transition-colors group"
              >
                {/* Time Label */}
                <div className="p-3 text-xs font-medium text-gray-400 text-center border-r border-[var(--color-frozen-water)] bg-white sticky left-0 z-10 font-mono">
                  {formatTimeLabel(minutes)}
                </div>

                {/* Day Cells */}
                {weekDays.map((day, dayIdx) => {
                  const booking = getBookingForCell(day, minutes);
                  const isMyBooking = booking?.userId === user?.id;

                  const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
                  const slotStartKyiv = setMinutes(setHours(day, Math.floor(minutes / 60)), minutes % 60);
                  const isPast = slotStartKyiv.getTime() <= nowKyiv.getTime();

                  let cellContent = null;
                  let cellClass = "border-l border-gray-50 p-1.5 relative transition-all duration-200 min-h-[48px]";

                  if (booking) {
                    cellClass = isMyBooking
                      ? "border-l border-white/50 p-1.5 relative bg-[var(--color-jungle-teal)]/10 cursor-pointer hover:bg-[var(--color-jungle-teal)]/20 min-h-[48px]"
                      : "border-l border-white/50 p-1.5 relative bg-[var(--color-frozen-water)]/40 cursor-not-allowed min-h-[48px]";

                    cellContent = (
                      <div
                        className={`h-full w-full rounded-md text-xs p-2 flex flex-col justify-center shadow-xs border relative group/card ${
                          isMyBooking
                            ? "bg-white/90 text-[var(--color-jungle-teal)] border-[var(--color-jungle-teal)]/30"
                            : "bg-white/80 text-gray-500 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold truncate leading-tight pr-3">
                            {booking.title || (isMyBooking ? "My Meeting" : booking.userName.split(" ")[0])}
                          </span>
                          {isMyBooking && onCancelClick && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelClick(booking.id, !!booking.recurringSeriesId);
                              }}
                              className="text-gray-400 hover:text-red-600 opacity-0 group-hover/card:opacity-100 transition-opacity p-0.5"
                              title="Cancel Booking"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] opacity-80 font-medium mt-0.5">
                          {format(parseISO(booking.startTime), "HH:mm")}
                        </span>
                      </div>
                    );
                  } else if (isPast) {
                    cellClass = "border-l border-gray-50 p-1.5 relative bg-slate-50/40 cursor-not-allowed min-h-[48px] opacity-40";
                    cellContent = (
                      <div
                        title="Past time slot cannot be booked"
                        className="h-full w-full flex items-center justify-center"
                      >
                        <span className="text-[10px] text-gray-400 font-mono">✕</span>
                      </div>
                    );
                  } else {
                    cellContent = (
                      <div
                        onClick={() => {
                          const utcIso = formatInTimeZone(slotStartKyiv, KYIV_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
                          onSlotClick(utcIso, selectedRoomId);
                        }}
                        className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <div className="w-3 h-3 rounded-full bg-[var(--color-jungle-teal)]/30 border-2 border-[var(--color-jungle-teal)] group-hover:scale-125 transition-transform"></div>
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
