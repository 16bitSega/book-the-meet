"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address (e.g. user@office.com).";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const success = await login({ email: email.trim(), password });
    setSubmitting(false);

    if (success) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back to BookMeet
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage your meeting room reservations
          </p>
        </div>

        {authError && (
          <div className="mt-6 rounded-lg bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200 leading-relaxed">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="user@office.com"
              className={`mt-1 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 ${
                fieldErrors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/20"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              className={`mt-1 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 ${
                fieldErrors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/20"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
