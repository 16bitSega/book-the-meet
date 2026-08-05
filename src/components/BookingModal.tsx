"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatInTimeZone } from "date-fns-tz";
import { addMinutes } from "date-fns";

interface BookingModalProps {
  startTimeIso: string;
  roomId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE = "https://full-spiders-battle.loca.lt";

export default function BookingModal({ startTimeIso, roomId, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("Team Sync");
  const [duration, setDuration] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const start = new Date(startTimeIso);
      const end = addMinutes(start, duration);

      const payload: any = {
        roomId,
        title,
        startTime: formatInTimeZone(start, "Europe/Kyiv", "yyyy-MM-dd'T'HH:mm:ssXXX"),
        endTime: formatInTimeZone(end, "Europe/Kyiv", "yyyy-MM-dd'T'HH:mm:ssXXX"),
        isRecurring,
      };

      if (isRecurring) {
        payload.recurrenceCount = recurrenceCount;
      }

      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setError("Slot unavailable. Please choose another time.");
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to create booking");

      onSuccess();
      onClose();
    } catch {
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Book Meeting Room</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Project Sync"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value={30}>30 mins</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={150}>2.5 hours</option>
              <option value={180}>3 hours</option>
              <option value={210}>3.5 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Repeat Weekly</span>
            </label>

            {isRecurring && (
              <div className="mt-3 pl-6 animate-in slide-in-from-top-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Number of weeks</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                  className="w-24 border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Total bookings: {recurrenceCount}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
