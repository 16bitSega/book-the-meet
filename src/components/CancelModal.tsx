"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Booking } from "./ScheduleGrid";

const KYIV_TIMEZONE = "Europe/Kyiv";
const API_BASE = "https://full-spiders-battle.loca.lt";

interface CancelModalProps {
  booking: Booking;
  roomName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelModal({
  booking,
  roomName,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startKyiv = toZonedTime(new Date(booking.startTime), KYIV_TIMEZONE);
  const endKyiv = toZonedTime(new Date(booking.endTime), KYIV_TIMEZONE);

  const isPast = new Date(booking.endTime).getTime() <= Date.now();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const handleCancel = async () => {
    if (isPast) {
      setErrorMsg("Past bookings cannot be cancelled.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}?mode=single`, {
        method: "DELETE",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Failed to cancel booking.");
        setSubmitting(false);
        return;
      }

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
      <div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Booking</h3>
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

        <div className="mt-6 space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Title:</span>
              <span className="font-semibold text-slate-800">{booking.title || "Meeting"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kyiv Time:</span>
              <span className="font-semibold text-slate-800">
                {format(startKyiv, "MMM dd, HH:mm")} - {format(endKyiv, "HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Organizer:</span>
              <span className="font-semibold text-slate-800">{booking.userName}</span>
            </div>
          </div>

          {isPast && (
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800">
              ⚠️ This booking has already ended and cannot be cancelled.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            {!isPast && (
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Cancel Reservation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
