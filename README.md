# FixMate 🔧

**A home services marketplace API — book a trusted technician, pay securely, get the job done.**

---

## The problem this solves

Finding a plumber, electrician, or cleaner today usually means asking around, calling a few numbers, and hoping someone shows up on time and charges a fair price. There's no shared record of who did the work, whether they were any good, or whether payment actually happened before the job started.

FixMate is the backend for a platform that fixes that by putting three actors in one system, with one shared source of truth for every job from request to payment to review:

| Actor | What they're trying to do |
|---|---|
| **Customer** | Find a qualified technician nearby, book them for a specific job, pay safely, and leave an honest review afterward. |
| **Technician** | Advertise their skills and availability, get discovered, and manage incoming jobs without back-and-forth phone calls. |
| **Admin** | Keep the platform trustworthy — moderate who's allowed on it, watch for problems, and manage the category list everyone browses by. |

Everything else in this API exists to serve one of those three people.

---

## The rules of the road (business logic)

These aren't arbitrary technical choices — each one encodes a real-world rule about how a services marketplace has to behave to stay trustworthy.

1. **A booking has one path, and every step is enforced by the server, not the client.**
   ```
   REQUESTED → ACCEPTED → PAID → IN_PROGRESS → COMPLETED
                  ↓
              DECLINED
   ```
   A customer can't mark their own job "completed." A technician can't skip straight from "requested" to "in progress" without accepting it first. Payment can only happen once a technician has actually agreed to do the job — nobody pays for a job nobody agreed to take.

2. **A customer can cancel — but only until the technician has actually started.** Once a job is `IN_PROGRESS`, cancelling would mean cancelling on someone mid-task, so the door closes there.

3. **You can only review a job that actually happened.** Reviews are locked to bookings that reached `COMPLETED`, and it's one review per booking — no review-bombing the same technician twice for the same job.

4. **Money moves through a real payment processor, never through the app itself.** FixMate never touches a card number. It asks Stripe to open a secure checkout session, and only trusts that money changed hands when Stripe itself confirms it via a signed webhook — not when the client *says* it paid. This is the difference between a real payment system and one that can be spoofed by anyone with Postman.

5. **Being blocked takes effect immediately, everywhere.** If an Admin bans a user, that user's already-issued login token stops working on their *very next request* — not after it expires. Trust and safety can't wait for a token to time out.

6. **Registration picks a role, and that's the last free choice you get.** A Customer or Technician chooses their role at signup — but nobody can register themselves as an Admin. Admin access is provisioned directly, on purpose, never through a public form.

---

## Roles & permissions

| Role | Can do |
|---|---|
| **Customer** | Browse services/technicians, book a job, pay, track status, cancel (pre-`IN_PROGRESS`), leave a review, manage own profile |
| **Technician** | Set up a profile (skills, experience, availability), view incoming bookings, accept/decline, move a job through in-progress → completed |
| **Admin** | View/ban/unban any user, view every booking platform-wide, manage the service category list |

---

## The data model

9 tables, 12 relations. The shape of it, in plain terms: **one `User` table for everyone** (a `role` column decides what they can do), with a **`TechnicianProfile`** hanging off any user who's a technician — so the door stays open to give Customers their own dedicated profile table later without touching what already exists.

```
                          ┌───────────┐
                          │  Profile  │ 1:1
                          └─────┬─────┘
                                │
        ┌───────────┐    ┌──────▼─────┐    ┌────────────────────┐
        │ Category  │    │    User    │◄───┤ TechnicianProfile   │ 1:1
        └─────┬─────┘    └──┬───┬───┬─┘    └──────────┬──────────┘
              │ 1:N         │   │   │                 │ 1:N
              │       cust  │   │   │ tech             │
              ▼             │   │   │                  ▼
        ┌───────────┐       │   │   │           ┌──────────────────┐
        │  Service  │◄──────┘   │   └──────────►│ AvailabilitySlot │
        └─────┬─────┘  1:N as   │    1:N as      └──────────────────┘
              │        technician│    technician
              │ 1:N              │
              ▼                  │
        ┌───────────┐            │
        │  Booking  │◄───────────┘ (customerId + technicianId — 2 FKs to User)
        └─────┬─────┘
           1:1│  1:1
        ┌─────┴─────┐
        ▼           ▼
   ┌─────────┐  ┌─────────┐
   │ Payment │  │ Review  │──► also FKs to User (customer + technician)
   └─────────┘  └─────────┘
```

**Why one `User` table instead of three?** Every one of Customer/Technician/Admin needs the exact same login, password, and ban/unban machinery — splitting that into three tables from day one would mean writing (and maintaining) the same auth logic three times for zero benefit. The full reasoning — every field, every "why optional," every relation — is written out in [`docs/AUTH_DESIGN_DECISIONS.md`](./docs/AUTH_DESIGN_DECISIONS.md).

**Key relations at a glance:**
- `User ←1:1→ Profile` — bio/photo/address, kept separate from login credentials
- `User ←1:1→ TechnicianProfile ←1:N→ AvailabilitySlot` — skills/experience + a full weekly schedule
- `Category ←1:N→ Service ←N:1→ User` (technician) — what's offered, by whom
- `Booking` — the hub: 2 FKs to `User` (customer *and* technician), 1 FK to `Service`, 1:1 to `Payment`, 1:1 to `Review`
- `Review` — FKs to both the `Booking` it's about *and* both `User`s involved, so a technician's reviews can be pulled directly off their profile

---

## Payment integration — Stripe

Payments run through **Stripe Checkout Sessions**, in the same server → Stripe → webhook pattern used elsewhere in this codebase (see the sibling PrismaPress project's subscription flow), adapted here for a one-off booking payment instead of a recurring subscription:

![Stripe payment flow](./docs/assets/stripe_flow_3.png)

**How it maps onto FixMate specifically:**

1. **Client → Server**: customer calls `POST /api/payments/create` for a booking the technician has already `ACCEPTED`.
2. **Server → Stripe**: the server creates a Stripe Checkout Session for the exact service price, and saves a `Payment` row (`status: PENDING`) with Stripe's session ID as the `transactionId`.
3. **Server → Client**: the customer gets back a real Stripe-hosted checkout URL — FixMate never sees or stores card details.
4. **Client pays on Stripe's own page.**
5. **Stripe Server (Webhook) → Server**: once payment actually completes, Stripe calls `POST /api/payments/confirm` with a cryptographically signed event. The server verifies that signature before trusting it — anyone hand-crafting a fake "payment succeeded" request gets rejected.
6. Only *then* does the `Payment` flip to `COMPLETED` and the `Booking` flip to `PAID`, unlocking the technician's "start job" step.

SSLCommerz is wired into the schema (`PaymentProvider: STRIPE | SSLCOMMERZ`) as the documented alternative provider for markets where Stripe isn't available, following the same create → redirect → verify shape.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime / API | Node.js, Express 5, TypeScript |
| Database / ORM | PostgreSQL, Prisma 7 (multi-file schema, driver adapters) |
| Auth | JWT (access + refresh tokens), bcrypt password hashing |
| Validation | Zod, enforced server-side on every write endpoint |
| Payments | Stripe Checkout + signed webhooks |

---

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, Stripe keys, admin credentials
npx prisma migrate dev
npm run seed            # creates the admin account + a sample technician/category/service
npm run dev
```

Full endpoint-by-endpoint request/response documentation, including the seeded admin login, lives in the Postman collection: [`postman/FixMate.postman_collection.json`](./postman/FixMate.postman_collection.json).
