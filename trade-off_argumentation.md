# UI Design & Architectural Trade-off Argumentation

## 1. Overview
This document outlines the architectural trade-offs, design decisions, and state management posture chosen for the Frontend UI layer and backend integration of the **BookMeet** application.

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

## 4. Styling, Design System & Custom Components

### Choice: Tailwind CSS + Custom Utility Tokens vs. Heavy Component Libraries (e.g. MUI, AntD)
* **Pros:**
  * Utility-first CSS produces a lightweight production CSS bundle.
  * Unrestricted flexibility for constructing the custom 30-minute schedule grid without third-party calendar dependencies (prohibited by spec).
  * Glassmorphism, custom scrollbars, and micro-animations easily defined via Tailwind tokens.

### Choice: Custom Styled Dropdown (`CustomSelect.tsx`) vs. Native OS `<select>`
* **Pros:**
  * **Brand & Visual Consistency:** Guarantees 100% adherence to the Jungle Teal color palette across desktop and mobile.
  * **Mobile UX:** Eliminates unstyled, floating OS-native black sheets on iOS and Android.
* **Trade-off:**
  * Requires custom React state management, outside-click event listeners, and portal positioning.
* **Mitigation:**
  * Encapsulated into a lightweight, reusable `<CustomSelect />` component with outside-click handling.

---

## 5. Mobile Layout & Responsive Navigation

### Choice: Golden Ratio Side Drawer (`61.8vw`) + React Portal vs. Standard Full-Width Drawer
* **Pros:**
  * **Aesthetic Harmony:** Incorporates the Golden Ratio ($\phi \approx 1.618$) where the active drawer occupies $61.8\text{vw}$ and the backdrop occupies $38.2\text{vw}$.
  * **Viewport Stacking:** Using `ReactDOM.createPortal` to render the drawer directly at `document.body` avoids CSS containing block bugs caused by `backdrop-filter` on sticky navigation parents.
* **Trade-off:**
  * Requires client-side hydration checks (`mounted` state) before invoking `createPortal`.

---

## 6. Grid State & Deep-Link Parameter Synchronization

### Choice: URL Query Parameter State Sync (`?weekStart=YYYY-MM-DD&roomId=...`) vs. In-Memory Component State
* **Pros:**
  * **Deep Linking & Persistence:** Allows direct navigation from *"My Bookings"* cards (`View in Grid →`) to the exact room and week of a reservation.
  * **Reload Resilience:** Preserves the user's selected week date across page reloads and booking CRUD actions.
* **Trade-off:**
  * Requires syncing React state with `window.history.replaceState`.
* **Mitigation:**
  * Wrapped in `useEffect` hooks so URL state updates silently without forcing redundant Next.js route transitions.

---

## 7. Targeted Cell Interaction & Hover Affordance

### Choice: Targeted Slot Cell Hover (`+ Book`) vs. Row-Wide Highlight
* **Pros:**
  * Displays action affordance (`+ Book`) strictly on the individual hovered slot cell rather than repeating across all 7 days of the row, preventing visual clutter.
* **Trade-off:**
  * Requires scoped CSS group modifiers (`group/cell`) for individual cell hover states.

---

## 8. Security & User Barrier Mechanics

### Choice: Client-Side Form Barriers + Server-Side 403 Enforcement
* **Email Verification Restriction:**
  * Unverified users see a warning banner and disabled submit buttons in booking modals.
  * Even if a user bypasses client UI controls, the server API enforces HTTP 403 `EMAIL_NOT_VERIFIED`.
* **CSRF & Token Revocation:**
  * Mutating requests pass custom origin headers.
  * Logout increments `tokenVersion` on the server, rendering any cached JWT instantly invalid across all devices.
