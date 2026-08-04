"use client";

import React, { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";
import { EmailVerificationBarrier } from "./EmailVerificationBarrier";

const KYIV_TIMEZONE = "Europe/Kyiv";
const API_BASE = "https://full-spiders-battle.loca.lt";

interface BookingModalProps {
  slotTimeIso: string;
  roomId: string;
  roomName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATION_OPTIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
  { label: "2.5 hours", minutes: 150 },
  { label: "3 hours", minutes: 180 },
  { label: "3.5 hours", minutes: 210 },
  { label: "4 hours", minutes: 240 },
];

export function BookingModal({
  slotTimeIso,
  roomId,
  roomName,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("Team Sync");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate start and end time in Kyiv time for preview
  const startDate = new Date(slotTimeIso);
  const startKyiv = toZonedTime(startDate, KYIV_TIMEZONE);
  const endDate = addMinutes(startDate, durationMinutes);
  const endKyiv = toZonedTime(endDate, KYIV_TIMEZONE);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Meeting title is required.");
      return;
    }

    if (!user?.isEmailVerified) {
      setErrorMsg("Email verification is required before creating bookings.");
      return;
    }

    setSubmitting(true);

    try {
      const endTimeIso = formatInTimeZone(
        addMinutes(new Date(slotTimeIso), durationMinutes),
        KYIV_TIMEZONE,
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
          roomId,
          title: title.trim(),
          startTime: slotTimeIso,
          endTime: endTimeIso,
          isRecurring: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg("The selected time slot is already booked for this room.");
        } else {
          setErrorMsg(data.message || "Failed to create booking.");
        }
        setSubmitting(false);
        return;
      }

      // Success
      onSuccess();
    } catch {
      setErrorMsg("An unexpected network error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Reservation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Room: {roomName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {!user?.isEmailVerified ? (
          <div className="mt-6 space-y-4">
            <EmailVerificationBarrier />
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Sprint Sync"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kyiv Start Time:</span>
                <span className="font-semibold text-slate-800">
                  {format(startKyiv, "EEEE, MMM dd 'at' HH:mm")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kyiv End Time:</span>
                <span className="font-semibold text-slate-800">
                  {format(endKyiv, "EEEE, MMM dd 'at' HH:mm")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Confirm Reservation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
