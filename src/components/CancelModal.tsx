"use client";

import React, { useState } from "react";

interface CancelModalProps {
  bookingId: string;
  hasRecurringSeries: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE = "https://full-spiders-battle.loca.lt";

type CancelMode = "single" | "series";

export default function CancelModal({ bookingId, hasRecurringSeries, onClose, onSuccess }: CancelModalProps) {
  const [mode, setMode] = useState<CancelMode>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}?mode=${mode}`, {
        method: "DELETE",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) throw new Error("Failed to cancel");

      onSuccess();
      onClose();
    } catch {
      setError("Could not cancel booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Booking</h3>
        <p className="text-slate-500 text-sm mb-6">Are you sure you want to cancel this booking?</p>

        {hasRecurringSeries && (
          <div className="mb-6 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="cancelMode"
                checked={mode === "single"}
                onChange={() => setMode("single")}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-slate-800">This occurrence only</span>
                <span className="block text-xs text-slate-500">Future bookings in this series will remain.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="cancelMode"
                checked={mode === "series"}
                onChange={() => setMode("series")}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-slate-800">All future occurrences</span>
                <span className="block text-xs text-slate-500">Cancels this and all remaining bookings in this series.</span>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
