"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createPortal } from "react-dom";

export function Navbar() {
  const { user, logout, resendVerification, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
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
    <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[var(--color-frozen-water)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Trigger Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
              title="Toggle Navigation Menu"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--color-jungle-teal)] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-[#567569] transition-colors shrink-0">
                B
              </div>
              <span className="font-bold text-xl text-[var(--color-jungle-teal)] tracking-tight">
                BookTheMeet
              </span>
            </button>

            {/* Desktop Navigation Links */}
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

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Email Verification Status */}
                {user.isEmailVerified ? (
                  <span className="badge-success inline-flex items-center gap-1">
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
                  <div className="text-right">
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

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[var(--color-jungle-teal)] hover:bg-[var(--color-azure-mist)] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Render Golden Ratio Mobile Side Drawer via React Portal directly into document.body */}
      {isMobileMenuOpen && mounted && createPortal(
        <div className="md:hidden fixed inset-0 z-[100] flex animate-in fade-in duration-200">
          {/* Part A: Active Side Menu (Golden Ratio width: 61.8vw) */}
          <div className="w-[61.8vw] max-w-xs bg-white h-[100dvh] shadow-2xl p-4 sm:p-5 flex flex-col justify-between border-r border-[var(--color-frozen-water)] overflow-y-auto relative z-10">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-[var(--color-frozen-water)]">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-jungle-teal)] flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-xs">
                    B
                  </div>
                  <span className="font-bold text-base sm:text-lg text-[var(--color-jungle-teal)] tracking-tight">
                    BookTheMeet
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 font-bold text-sm"
                  title="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              {user ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Navigation</p>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors ${
                      pathname === "/"
                        ? "bg-[var(--color-jungle-teal)] text-white shadow-xs"
                        : "text-gray-700 bg-[var(--color-azure-mist)]/50 hover:bg-[var(--color-azure-mist)]"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Grid
                  </Link>
                  <Link
                    href="/my-bookings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors ${
                      pathname === "/my-bookings"
                        ? "bg-[var(--color-jungle-teal)] text-white shadow-xs"
                        : "text-gray-700 bg-[var(--color-azure-mist)]/50 hover:bg-[var(--color-azure-mist)]"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002 2" />
                    </svg>
                    My Bookings
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center btn-secondary text-sm py-3"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center btn-primary text-sm py-3 shadow-md shadow-[var(--color-jungle-teal)]/20"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile User Footer Info & Logout */}
            {user && (
              <div className="pt-4 border-t border-[var(--color-frozen-water)] space-y-3 mt-6">
                <div className="bg-[var(--color-azure-mist)] p-3 rounded-xl border border-[var(--color-frozen-water)]">
                  <p className="text-xs font-bold text-gray-900">{user.name || user.email}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  {!user.isEmailVerified && (
                    <button
                      onClick={handleResend}
                      className="mt-2 text-xs text-[var(--color-jungle-teal)] font-bold underline"
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn-secondary text-xs py-2.5 text-center font-bold"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Part B: Outside Backdrop (Golden Ratio width: 38.2vw) - Tap outside to close, no cross icon */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex-1 bg-slate-900/60 backdrop-blur-xs cursor-pointer h-[100dvh]"
            aria-label="Close menu backdrop"
          />
        </div>,
        document.body
      )}

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
