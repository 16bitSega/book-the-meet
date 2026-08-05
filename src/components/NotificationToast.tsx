"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO, isWithinInterval, addMinutes } from "date-fns";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface NotificationToastProps {
  bookings: Booking[];
}

const NOTIFY_BEFORE_MINUTES = 10;
const STORAGE_KEY = "book-the-meet-dismissed-alerts";

export function NotificationToast({ bookings }: NotificationToastProps) {
  const [activeAlert, setActiveAlert] = useState<Booking | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();

      const relevantBooking = bookings.find((b) => {
        if (dismissedIds.has(b.id)) return false;

        const start = parseISO(b.startTime);
        const end = parseISO(b.endTime);

        // Check if we are within 10 mins before start OR within 10 mins before end
        const warningStart = addMinutes(start, -NOTIFY_BEFORE_MINUTES);
        const warningEnd = addMinutes(end, -NOTIFY_BEFORE_MINUTES);

        const isApproachingStart = isWithinInterval(now, { start: warningStart, end: start });
        const isApproachingEnd = isWithinInterval(now, { start: warningEnd, end: end });

        return isApproachingStart || isApproachingEnd;
      });

      if (relevantBooking) {
        setActiveAlert(relevantBooking);
      } else {
        setActiveAlert(null);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [bookings, dismissedIds]);

  const handleDismiss = () => {
    if (!activeAlert) return;

    const newDismissed = new Set(dismissedIds).add(activeAlert.id);
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newDismissed]));
    } catch {
      // Ignore localStorage write error
    }
    setActiveAlert(null);
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 border border-slate-700">
        <div className="flex-shrink-0">
          <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-blue-400 animate-pulse"></div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-xs text-white">Upcoming: {activeAlert.title}</h4>
          <p className="text-xs text-slate-300 mt-1">
            Starts at {format(parseISO(activeAlert.startTime), "HH:mm")}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
