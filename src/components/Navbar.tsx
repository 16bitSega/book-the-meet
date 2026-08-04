"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, logout, resendVerification } = useAuth();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async () => {
    setResendStatus("Sending...");
    const success = await resendVerification();
    if (success) {
      setResendStatus("Verification link sent! Check server console.");
      setTimeout(() => setResendStatus(null), 5000);
    } else {
      setResendStatus("Failed to send.");
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  return (
    <nav className="glass-card sticky top-0 z-40 w-full shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              BookMeet
            </span>
          </Link>

          {user && (
            <div className="hidden space-x-4 md:flex">
              <Link
                href="/"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                Schedule Grid
              </Link>
              <Link
                href="/my-bookings"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                My Bookings
              </Link>
            </div>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3 text-sm">
              <span className="hidden font-medium text-slate-800 sm:inline">
                {user.name}
              </span>

              {/* Email Verification Status Badge */}
              {user.isEmailVerified ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                    Unverified
                  </span>
                  <button
                    onClick={handleResend}
                    className="text-xs text-blue-600 underline hover:text-blue-800"
                  >
                    Resend link
                  </button>
                </div>
              )}

              <button
                onClick={logout}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Resend Status Toast Banner */}
      {resendStatus && (
        <div className="bg-blue-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          {resendStatus}
        </div>
      )}
    </nav>
  );
}
