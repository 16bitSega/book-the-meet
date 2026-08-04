# UI Design & Architectural Trade-off Argumentation

## 1. Overview
This document outlines the architectural trade-offs, design decisions, and state management posture chosen for the Frontend UI layer (Phase 3) of the **BookMeet** application.

---

## 2. Frontend Framework & Component Architecture

### Choice: Next.js 16 App Router + Client/Server Component Separation
* **Pros:**
  * **Performance & SEO:** Static and server-rendered shell for immediate FCP (First Contentful Paint).
  * **Security:** Sensitive auth cookies (`HttpOnly`) are managed securely via Route Handlers without exposing tokens to client-side storage.
* **Trade-off:**
  * React Server Components (RSC) cannot use hooks (`useState`, `useEffect`, `useContext`).
  * **Solution:** Interactive forms and calendar components are explicitly marked as `'use client'`, while the root layout and page wrappers leverage server capabilities.

---

## 3. Global Auth State Management

### Choice: React Context (`AuthContext`) vs. Third-Party State (Redux / Zustand)
* **Pros:**
  * Zero additional bundle overhead; built directly into React runtime.
  * Perfect fit for user session persistence (`GET /api/auth/me`).
* **Cons:**
  * Context re-renders children when session state updates.
* **Mitigation:**
  * Auth state changes infrequently (on login, logout, email verification update). Wrapping top-level components in `AuthContext` provides optimal developer ergonomics without performance bottlenecks.

---

## 4. Styling & Design System Tokens

### Choice: Tailwind CSS + Custom Utility Tokens vs. Heavy Component Libraries (e.g. MUI, AntD)
* **Pros:**
  * Utility-first CSS produces a lightweight production CSS bundle.
  * Unrestricted flexibility for constructing the custom 30-minute schedule grid without third-party calendar dependencies (prohibited by spec).
  * Glassmorphism, custom scrollbars, and micro-animations easily defined via Tailwind tokens.

---

## 5. Security & User Barrier Mechanics

### Choice: Client-Side Form Barriers + Server-Side 403 Enforcement
* **Email Verification Restriction:**
  * Unverified users see a warning banner and disabled submit buttons in booking modals.
  * Even if a user bypasses client UI controls, the server API enforces HTTP 403 `EMAIL_NOT_VERIFIED`.
* **CSRF & Token Revocation:**
  * Mutating requests pass custom origin headers.
  * Logout increments `tokenVersion` on the server, rendering any cached JWT instantly invalid across all devices.
