"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, logout, resendVerification, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleResend = async () => {
    setResendStatus("Sending...");
    const success = await resendVerification();
    if (success) {
      setResendStatus("Verification link sent! Check terminal console.");
      setTimeout(() => setResendStatus(null), 5000);
    } else {
      setResendStatus("Failed to send.");
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  if (authLoading) return null;

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[var(--color-frozen-water)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-jungle-teal)] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-[#567569] transition-colors">
                B
              </div>
              <span className="font-bold text-xl text-[var(--color-jungle-teal)] tracking-tight">
                BookTheMeet
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-4 border-l border-[var(--color-frozen-water)] pl-6">
                <Link
                  href="/"
                  className={`text-sm font-semibold transition-colors ${
                    pathname === "/"
                      ? "text-[var(--color-jungle-teal)] underline underline-offset-4"
                      : "text-gray-600 hover:text-[var(--color-jungle-teal)]"
                  }`}
                >
                  Schedule Grid
                </Link>
                <Link
                  href="/my-bookings"
                  className={`text-sm font-semibold transition-colors ${
                    pathname === "/my-bookings"
                      ? "text-[var(--color-jungle-teal)] underline underline-offset-4"
                      : "text-gray-600 hover:text-[var(--color-jungle-teal)]"
                  }`}
                >
                  My Bookings
                </Link>
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Email Verification Status */}
                {user.isEmailVerified ? (
                  <span className="badge-success hidden sm:inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-jungle-teal)]"></span>
                    Verified
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      Unverified
                    </span>
                    <button
                      onClick={handleResend}
                      className="text-xs text-[var(--color-jungle-teal)] font-semibold underline hover:text-[#567569]"
                    >
                      Resend link
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 pl-3 border-l border-[var(--color-frozen-water)]">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/login"
                      ? "text-[var(--color-jungle-teal)] font-bold"
                      : "text-gray-600 hover:text-[var(--color-jungle-teal)]"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm shadow-md shadow-[var(--color-jungle-teal)]/20"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resend Toast Banner */}
      {resendStatus && (
        <div className="bg-[var(--color-jungle-teal)] px-4 py-1.5 text-center text-xs font-medium text-white">
          {resendStatus}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
