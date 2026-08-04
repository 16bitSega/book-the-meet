"use client";

import React, { useState, useMemo } from "react";
import { format, addWeeks, subWeeks, startOfWeek, isSameDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";

// Constants
const KYIV_TIMEZONE = "Europe/Kyiv";
const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 19;
const SLOT_DURATION_MINUTES = 30;
const TOTAL_SLOTS = ((OFFICE_END_HOUR - OFFICE_START_HOUR) * 60) / SLOT_DURATION_MINUTES;

// Types
export interface Booking {
  id: string;
  title: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  userId: string;
  userName: string;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

interface ScheduleGridProps {
  bookings: Booking[];
  onSlotClick: (startTimeIso: string, roomId: string) => void;
  rooms: Room[];
  selectedRoomId: string;
  onRoomChange: (roomId: string) => void;
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

export default function ScheduleGrid({
  bookings,
  onSlotClick,
  rooms,
  selectedRoomId,
  onRoomChange,
  currentWeekStart,
  onWeekChange,
}: ScheduleGridProps) {
  const { user } = useAuth();

  // Derived Dates for the Grid Header (Mon-Sun in Kyiv Time)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Time Slots (09:00 - 19:00)
  const timeSlots = useMemo(() => {
    return Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
      return OFFICE_START_HOUR * 60 + i * SLOT_DURATION_MINUTES;
    });
  }, []);

  // Navigation Handlers
  const handlePrevWeek = () => onWeekChange(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => onWeekChange(addWeeks(currentWeekStart, 1));
  const handleToday = () => {
    const nowKyiv = toZonedTime(new Date(), KYIV_TIMEZONE);
    onWeekChange(startOfWeek(nowKyiv, { weekStartsOn: 1 }));
  };

  // Helper to get booking for a specific cell
  const getBookingForCell = (dayDate: Date, startMinutes: number) => {
    if (!selectedRoomId) return null;

    const hours = Math.floor(startMinutes / 60);
    const mins = startMinutes % 60;

    const slotStartKyiv = new Date(dayDate);
    slotStartKyiv.setHours(hours, mins, 0, 0);

    const slotStartIso = formatInTimeZone(slotStartKyiv, KYIV_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");

    return bookings.find((b) => {
      if (b.roomId !== selectedRoomId) return false;
      const bStart = new Date(b.startTime).getTime();
      const sStart = new Date(slotStartIso).getTime();

      return Math.abs(bStart - sStart) < 60000;
    });
  };

  const formatTimeLabel = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const userLocalTz = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  return (
    <div className="w-full rounded-2xl bg-white shadow-md border border-slate-200 overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors"
            title="Previous Week"
          >
            ←
          </button>
          <span className="font-semibold text-slate-800 min-w-[140px] text-center text-sm">
            {format(currentWeekStart, "MMM dd, yyyy")}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors"
            title="Next Week"
          >
            →
          </button>
          <button
            onClick={handleToday}
            className="ml-2 px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-800 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Room:
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => onRoomChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs">
            Displaying: <span className="font-bold">Kyiv Time (UTC+2/3)</span>
            <br />
            Your Local: <span className="font-semibold">{userLocalTz}</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200 bg-slate-100/70">
            <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Time
            </div>
            {weekDays.map((day, i) => {
              const isToday = isSameDay(toZonedTime(new Date(), KYIV_TIMEZONE), day);
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-l border-slate-200 ${
                    isToday ? "bg-blue-50 text-blue-800" : "text-slate-700"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase">{format(day, "EEE")}</div>
                  <div className={`text-sm font-bold ${isToday ? "text-blue-600" : ""}`}>
                    {format(day, "dd MMM")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body Rows (Time Slots) */}
          <div className="relative divide-y divide-slate-100">
            {timeSlots.map((minutes) => (
              <div
                key={minutes}
                className="grid grid-cols-[70px_repeat(7,1fr)] hover:bg-slate-50/50 transition-colors"
              >
                {/* Time Label */}
                <div className="p-2 text-xs font-mono text-slate-500 text-right pr-3 border-r border-slate-200 bg-slate-50/50 sticky left-0 font-medium">
                  {formatTimeLabel(minutes)}
                </div>

                {/* Day Cells */}
                {weekDays.map((day, dayIdx) => {
                  const booking = getBookingForCell(day, minutes);
                  const isMyBooking = booking?.userId === user?.id;

                  let cellContent = null;
                  let cellClass = "border-l border-slate-200 p-1 relative group cursor-pointer min-h-[44px]";

                  if (booking) {
                    cellClass = isMyBooking
                      ? "border-l border-slate-200 p-1 relative bg-blue-50/60 cursor-default min-h-[44px]"
                      : "border-l border-slate-200 p-1 relative bg-slate-100/60 cursor-not-allowed min-h-[44px]";

                    cellContent = (
                      <div
                        className={`h-full w-full rounded-md text-xs p-1.5 flex flex-col justify-center overflow-hidden transition-all shadow-xs ${
                          isMyBooking
                            ? "bg-blue-600 text-white border border-blue-700"
                            : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        <span className="font-semibold truncate">
                          {isMyBooking ? "My Booking" : booking.userName}
                        </span>
                        <span className="text-[10px] opacity-90 truncate">
                          {booking.title || "Reserved"}
                        </span>
                      </div>
                    );
                  } else {
                    // Available Slot Interaction
                    cellContent = (
                      <div
                        onClick={() => {
                          const hours = Math.floor(minutes / 60);
                          const mins = minutes % 60;
                          const slotStartKyiv = new Date(day);
                          slotStartKyiv.setHours(hours, mins, 0, 0);
                          const utcIso = fromZonedTime(slotStartKyiv, KYIV_TIMEZONE).toISOString();
                          onSlotClick(utcIso, selectedRoomId);
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
