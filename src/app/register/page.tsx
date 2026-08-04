"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { register, error: authError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [successMsg, setSuccessMsg] = useState(false);

  const validateForm = () => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!name.trim()) {
      errors.name = "Full name is required.";
    } else if (name.trim().length > 50) {
      errors.name = "Name must not exceed 50 characters.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address (e.g. user@office.com).";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else if (password.length > 72) {
      errors.password = "Password must not exceed 72 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
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
    const success = await register({ name: name.trim(), email: email.trim(), password });
    setSubmitting(false);

    if (success) {
      setSuccessMsg(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 3000);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your BookMeet Account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Join your team and reserve office meeting rooms
          </p>
        </div>

        {authError && (
          <div className="mt-6 rounded-lg bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
            {authError}
          </div>
        )}

        {successMsg ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800">Registration Successful!</h3>
            <p className="mt-1 text-xs text-emerald-700">
              A verification link has been logged to the server console. Redirecting to home page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Jane Doe"
                className={`mt-1 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.name
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/20"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.name}</p>
              )}
            </div>

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
                placeholder="jane@office.com"
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
                  if (confirmPassword && e.target.value !== confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
                  } else if (confirmPassword && e.target.value === confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (password !== e.target.value) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
                  } else {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder="••••••••"
                className={`mt-1 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.confirmPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/20"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Registering..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
