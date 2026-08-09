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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type RecurrenceFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export default function BookingModal({ startTimeIso, roomId, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("Team Sync");
  const [duration, setDuration] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("WEEKLY");
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
        payload.recurrenceFrequency = recurrenceFrequency;
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to create booking.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getFrequencyUnitLabel = () => {
    switch (recurrenceFrequency) {
      case "DAILY":
        return "days";
      case "WEEKLY":
        return "weeks";
      case "BIWEEKLY":
        return "bi-weekly cycles (every 2 weeks)";
      case "MONTHLY":
        return "months";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[var(--color-frozen-water)]">
        <h3 className="text-xl font-bold text-[var(--color-jungle-teal)] mb-4">Select Your Meeting Time</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field"
              placeholder="e.g., Project Sync"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Duration (minutes)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="input-field bg-white"
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

          <div className="pt-2 border-t border-[var(--color-frozen-water)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded text-[var(--color-jungle-teal)] focus:ring-[var(--color-jungle-teal)]"
              />
              <span className="text-sm font-semibold text-gray-800">Repeat Meeting</span>
            </label>

            {isRecurring && (
              <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Recurrence Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurrenceFrequency("DAILY")}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                        recurrenceFrequency === "DAILY"
                          ? "bg-[var(--color-jungle-teal)] text-white border-[var(--color-jungle-teal)]"
                          : "bg-[var(--color-azure-mist)] text-gray-700 border-[var(--color-frozen-water)] hover:bg-[var(--color-frozen-water)]"
                      }`}
                    >
                      Repeat Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceFrequency("WEEKLY")}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                        recurrenceFrequency === "WEEKLY"
                          ? "bg-[var(--color-jungle-teal)] text-white border-[var(--color-jungle-teal)]"
                          : "bg-[var(--color-azure-mist)] text-gray-700 border-[var(--color-frozen-water)] hover:bg-[var(--color-frozen-water)]"
                      }`}
                    >
                      Repeat Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceFrequency("BIWEEKLY")}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                        recurrenceFrequency === "BIWEEKLY"
                          ? "bg-[var(--color-jungle-teal)] text-white border-[var(--color-jungle-teal)]"
                          : "bg-[var(--color-azure-mist)] text-gray-700 border-[var(--color-frozen-water)] hover:bg-[var(--color-frozen-water)]"
                      }`}
                    >
                      Bi-weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceFrequency("MONTHLY")}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                        recurrenceFrequency === "MONTHLY"
                          ? "bg-[var(--color-jungle-teal)] text-white border-[var(--color-jungle-teal)]"
                          : "bg-[var(--color-azure-mist)] text-gray-700 border-[var(--color-frozen-water)] hover:bg-[var(--color-frozen-water)]"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Number of Repetitions ({getFrequencyUnitLabel()})
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                    className="w-24 border border-[var(--color-frozen-water)] rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-[var(--color-jungle-teal)] outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Total bookings: {recurrenceCount} ({getFrequencyUnitLabel()})
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-frozen-water)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs shadow-md shadow-[var(--color-jungle-teal)]/20 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
