# BookMeet — Office Meeting Room Reservation Application

BookMeet is a modern, high-performance web application for reserving office meeting rooms with strict concurrency guarantees, daylight saving time (DST) awareness for the Kyiv timezone (`Europe/Kyiv`), and a sleek React UI built on Next.js 16.

---

## 🌟 Key Features

* **Strict Race Protection:** Powered by PostgreSQL 16 partial `GiST` exclusion constraints (`tstzrange` with `WHERE status = 'ACTIVE'`). Prevents overlapping bookings even under 50+ concurrent requests.
* **DST-Aware Kyiv Timezone Engine:** Built with `date-fns-tz` handling Europe/Kyiv daylight saving time shifts (March 29 & October 25 transitions) without wall-clock drift.
* **Authentication & Verification Barrier:** JWT HttpOnly cookies with `tokenVersion` session revocation, bcrypt password hashing, and high-entropy SHA-256 email verification tokens.
* **Custom Pure CSS Grid Calendar:** 30-minute vertical time axis (09:00 to 19:00 Kyiv office hours), 7-day horizontal axis, room selector, sticky days header row, and user local timezone conversion.
* **Flexible Recurring Bookings:** Schedule recurring meetings with multiple frequencies (**Daily**, **Weekly**, **Bi-weekly**, and **Monthly**) up to 12 repetitions, with support for cancelling single instances or entire future series.
* **Golden Ratio Mobile Experience:** Mobile side drawer navigation designed according to the Golden Ratio ($61.8\text{vw}$ menu, $38.2\text{vw}$ tap-outside backdrop), with custom Jungle Teal dropdowns (`CustomSelect`).
* **Deep-Link Grid Navigation:** Direct navigation from *"My Bookings"* cards (`View in Grid →`) landing precisely on the corresponding room and week date.
* **In-App Notification Alerts:** Toast notifications alerting users 10 minutes prior to booking start/end times with `localStorage` deduplication.

---

## 🚀 Quick Start (Single-Command Docker Launch)

### 1. Prerequisites
* Node.js >= 22.0.0
* Docker & Docker Compose

### 2. Clone & Setup Environment
```bash
git clone https://github.com/16bitSega/book-the-meet.git
cd book-the-meet
cp .env.example .env
```

### 3. Start Database & App via Docker Compose
```bash
docker-compose up -d --build
```

### 4. Run Migrations & Seed Initial Data
```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Access the Web Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Seed Accounts

| Role | Email | Password | Email Verified |
| :--- | :--- | :--- | :---: |
| **Admin User** | `admin@office.com` | `password123` | ✅ Verified |
| **Test User** | `user@office.com` | `password123` | ✅ Verified |

---

## 🧪 Running Automated Test Suite

BookMeet includes a comprehensive Vitest unit, timezone DST, boundary, and concurrency test suite:

```bash
# Run all 32 Vitest tests
npm test

# Run concurrency tests specifically
npm run test:concurrency
```

---

## 🏗 Architectural Summary

* **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS (Jungle Teal Theme)
* **Backend:** Next.js Route Handlers with 6-stage pipeline (IP Rate Limiting -> Auth & CSRF -> User Rate Limiting -> Zod DTO Validation -> Business Rules -> DB Execution)
* **Database:** PostgreSQL 16 with `citext` and `btree_gist` extensions
* **ORM:** Prisma 7 with `@prisma/adapter-pg` driver adapter
* **Containerization:** Docker multi-stage build (Node 24 Alpine)

---

## 📜 License
MIT License. Developed for BookMeet Office Scheduling.
