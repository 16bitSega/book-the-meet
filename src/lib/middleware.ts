import { NextRequest, NextResponse } from "next/server";

// Rate Limiter In-Memory Store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Validates CSRF posture for mutating HTTP methods (POST, PUT, DELETE).
 * Returns true if valid, false if rejected.
 */
export function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // Reject if both Origin and Referer are absent
  if (!origin && !referer) {
    return false;
  }

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * In-Memory Sliding Window Rate Limiter.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(key: string, limit: number, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
