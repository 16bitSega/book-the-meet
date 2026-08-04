"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, refreshUser, resendVerification } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setErrorMsg("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          await refreshUser();
        } else {
          setErrorMsg(data.message || "Verification token is invalid or expired.");
        }
      } catch {
        setErrorMsg("Failed to connect to the server.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    setResendStatus("Sending new link...");
    const ok = await resendVerification();
    if (ok) {
      setResendStatus("New verification link logged to server console!");
    } else {
      setResendStatus("Failed to resend link. Make sure you are signed in.");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Email Verification
        </h1>

        {verifying ? (
          <div className="mt-6 py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Verifying your email token...</p>
          </div>
        ) : success ? (
          <div className="mt-6 py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Email Verified!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your email has been successfully verified. You can now create and manage room reservations.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              Go to Schedule Grid
            </Link>
          </div>
        ) : (
          <div className="mt-6 py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              ✕
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Verification Failed</h2>
            <p className="mt-2 text-sm text-slate-600">{errorMsg}</p>

            {user && (
              <button
                onClick={handleResend}
                className="mt-6 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
              >
                Resend Verification Link
              </button>
            )}

            {resendStatus && (
              <p className="mt-3 text-xs font-medium text-blue-600">{resendStatus}</p>
            )}

            <Link
              href="/"
              className="mt-4 inline-block text-xs font-medium text-slate-500 hover:text-slate-700 underline"
            >
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
