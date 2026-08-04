"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function EmailVerificationBarrier() {
  const { resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setStatusMsg(null);
    const success = await resendVerification();
    setSending(false);

    if (success) {
      setStatusMsg("Verification email sent! Check dev console or inbox.");
    } else {
      setStatusMsg("Failed to send verification email. Please try again.");
    }
  };

  return (
    <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Email Verification Required
          </h4>
          <p className="mt-1 text-xs text-amber-700 leading-relaxed">
            Your email address is unverified. Creating meeting room reservations is restricted until your email is verified.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleResend}
              disabled={sending}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {sending ? "Sending Link..." : "Resend Verification Email"}
            </button>
          </div>

          {statusMsg && (
            <p className="mt-2 text-xs font-medium text-amber-800">{statusMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
