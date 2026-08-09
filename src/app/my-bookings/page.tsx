"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";
import CancelModal from "@/components/CancelModal";
import { EmailVerificationBarrier } from "@/components/EmailVerificationBarrier";

const KYIV_TIMEZONE = "Europe/Kyiv";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

interface MyBookingItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "CANCELLED";
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  recurringSeriesId?: string | null;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<MyBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cancelTarget, setCancelTarget] = useState<{
    bookingId: string;
    hasSeries: boolean;
  } | null>(null);

  const fetchMyBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/bookings/my?tab=${activeTab}&page=${page}&limit=10`,
        {
          headers: {
            "Bypass-Tunnel-Reminder": "true",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch my bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, page]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    fetchMyBookings();
  }, [user, authLoading, activeTab, page, fetchMyBookings, router]);

  const handleCancelClick = (b: MyBookingItem) => {
    setCancelTarget({
      bookingId: b.id,
      hasSeries: !!b.recurringSeriesId,
    });
  };

  const handleCancelSuccess = () => {
    setCancelTarget(null);
    fetchMyBookings();
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
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Bookings Dashboard
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              View and manage your upcoming and past meeting room reservations.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            ← Back to Schedule Grid
          </Link>
        </div>

        {/* Unverified Email Warning */}
        {user && !user.isEmailVerified && (
          <div className="mb-4">
            <EmailVerificationBarrier />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => {
              setActiveTab("upcoming");
              setPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === "upcoming"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Upcoming Reservations
          </button>
          <button
            onClick={() => {
              setActiveTab("past");
              setPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === "past"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Past History
          </button>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-8 border border-slate-200">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-xs font-medium text-slate-500">Loading your reservations...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xl font-bold">
              📅
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No {activeTab} bookings found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === "upcoming"
                ? "You haven't reserved any upcoming meeting room slots yet."
                : "No past meeting history found."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
              >
                Book a Slot Now
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const startKyiv = toZonedTime(new Date(b.startTime), KYIV_TIMEZONE);
              const endKyiv = toZonedTime(new Date(b.endTime), KYIV_TIMEZONE);
              const isCancelled = b.status === "CANCELLED";

              return (
                <div
                  key={b.id}
                  className={`glass-card rounded-2xl p-5 border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isCancelled
                      ? "border-slate-200 bg-slate-50/60 opacity-70"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {b.title || "Meeting"}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          isCancelled
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        📍 Room: <strong className="text-slate-800">{b.roomName || "Office Room"}</strong>
                      </span>
                      <span>
                        🕒 Kyiv Time:{" "}
                        <strong className="text-slate-800">
                          {format(startKyiv, "EEEE, MMM dd 'at' HH:mm")} - {format(endKyiv, "HH:mm")}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    {!isCancelled && activeTab === "upcoming" && (
                      <button
                        onClick={() => handleCancelClick(b)}
                        className="rounded-lg bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        Cancel Slot
                      </button>
                    )}

                    <Link
                      href="/"
                      className="rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      View in Grid →
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-xs font-medium text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          bookingId={cancelTarget.bookingId}
          hasRecurringSeries={cancelTarget.hasSeries}
          onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </main>
  );
}
