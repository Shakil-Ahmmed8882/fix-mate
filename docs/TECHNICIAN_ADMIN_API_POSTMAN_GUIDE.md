# Technician + Admin API — Postman testing guide

Base URL: `http://localhost:5000`

Read [CUSTOMER_API_POSTMAN_GUIDE.md](./CUSTOMER_API_POSTMAN_GUIDE.md) first — this doc picks up where that one left off and assumes the same auth/cookie setup.

**Important update since that doc was written:** `POST /api/users/register` now accepts an optional `role` field (`CUSTOMER` or `TECHNICIAN` — `ADMIN` is deliberately not self-registerable). This was a gap fixed in this pass: your spec says "Users select their role during registration," but the endpoint previously always defaulted to `CUSTOMER`. Registering as `TECHNICIAN` now also auto-creates an empty `TechnicianProfile` for you.

There is still no seed data and no way to create an Admin account through the API (by design — nobody should self-register as Admin). To get an Admin account for testing, ask me to create one directly in the database, the same way I did to verify this build.

---

## Part A — Technician APIs (`/api/technician/...`)

All routes below require `auth(Role.TECHNICIAN)` — the accessToken cookie/header must belong to a user with `role: TECHNICIAN`.

### Register + log in as a Technician

`POST /api/users/register`
```json
{
  "name": "Sam Electrician",
  "email": "sam@example.com",
  "password": "Secret123!",
  "phone": "+8801700000001",
  "role": "TECHNICIAN"
}
```
**Expected 200:** created user with `role: "TECHNICIAN"`, nested `profile` (empty) and `technicianProfile` (empty: `skills: []`, `experienceYears: 0`, `isAvailable: true`).

`POST /api/auth/login` — same as the customer flow, with this technician's email/password.

### `PUT /api/technician/profile`
```json
{
  "skills": ["electrical wiring", "panel upgrades"],
  "experienceYears": 8,
  "isAvailable": true
}
```
All fields optional — send only what you want to change. **Expected 200:** the updated `TechnicianProfile`.

### `PUT /api/technician/availability`
This **replaces the technician's entire weekly schedule** in one call (not additive) — send the complete set of slots you want, every time.
```json
{
  "slots": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 3, "startTime": "10:00", "endTime": "18:00" }
  ]
}
```
`dayOfWeek`: 0 = Sunday … 6 = Saturday. Times must be `HH:mm` 24-hour format, and `startTime` must be earlier than `endTime`.

**Expected 400** for `dayOfWeek` outside 0–6, malformed times, or `startTime >= endTime`.
**Expected 200:** the full new list of `AvailabilitySlot` rows (old ones are deleted, these are the only ones that now exist).

### `GET /api/technician/bookings`
Optional query params: `?status=REQUESTED&page=1&limit=10`

**Expected 200:** only bookings where this technician is the assigned technician (enforced server-side).

### `PATCH /api/technician/bookings/:id`
This is the one endpoint that drives the entire booking state machine from the technician side.
```json
{ "status": "ACCEPTED" }
```
Allowed `status` values and exactly which transition is legal from which current state:

| Current status | Allowed next status |
|---|---|
| `REQUESTED` | `ACCEPTED` or `DECLINED` |
| `PAID` | `IN_PROGRESS` |
| `IN_PROGRESS` | `COMPLETED` |
| anything else (`ACCEPTED`, `DECLINED`, `CANCELLED`, `COMPLETED`) | **no further transition allowed** |

**Expected 400** if you request a transition not in that table, with a message naming exactly which transitions ARE allowed from the current state, e.g. `"Cannot move a REQUESTED booking to COMPLETED. Allowed next status(es): ACCEPTED, DECLINED"`.
**Expected 403** if the booking belongs to a different technician.
**Expected 404** if the booking id doesn't exist.

Note: **you cannot move REQUESTED straight to PAID or IN_PROGRESS** — the booking must go through the customer's `POST /api/payments/create` + a completed Stripe payment first, which is what flips it to `PAID` automatically.

---

## Part B — Admin APIs (`/api/admin/...`)

All routes below require `auth(Role.ADMIN)`.

### Getting an Admin account
There's no self-registration path for Admin. Ask me to seed one directly (same as I did during verification), or promote an existing user's role directly in the database.

`POST /api/auth/login` with the admin's email/password, same as any other role.

### `GET /api/admin/users`
Optional query params: `?searchTerm=jane&role=TECHNICIAN&page=1&limit=20`

**Expected 200:** every user in the system (all roles), password always omitted, with `profile` and `technicianProfile` nested.

### `PATCH /api/admin/users/:id`
```json
{ "activeStatus": "BLOCKED" }
```
or
```json
{ "activeStatus": "ACTIVE" }
```
This endpoint **only** toggles ban status — confirmed scope, not a general user editor (name/email/role are not editable here).

**Expected 200:** the updated user.
**Expected 404** if the user id doesn't exist.

**What banning actually does, verified in testing:** the instant a user is set to `BLOCKED`, every one of their *already-issued, still-unexpired* access tokens stops working immediately (every request re-checks `activeStatus` from the database, not from the token) — and they cannot log in again while blocked, even with the correct password. Unbanning (`ACTIVE`) immediately restores both.

### `GET /api/admin/bookings`
Optional query params: `?status=COMPLETED&page=1&limit=10`

**Expected 200:** every booking in the system, regardless of customer/technician, with the same nested `service`/`technician`/`customer`/`payment`/`review` shape as the customer/technician booking endpoints.

### `GET /api/admin/categories`
Same shape as the public `GET /api/categories`, just also reachable by an admin (no functional difference — this exists so an admin-facing dashboard doesn't need to hit the public route).

### `POST /api/admin/categories`
```json
{ "name": "Painting", "description": "Interior and exterior painting" }
```
**Expected 409** if a category with this exact `name` already exists.
**Expected 200:** the created category.

---

## A gap worth knowing about: how do Services get created?

Right now, **there is no endpoint for a Technician to create their own Service** (a specific offering like "Kitchen sink repair — $50"). The spec's Technician Features list says "Create and update service profile (skills, experience, pricing)," which this pass interpreted as the `TechnicianProfile` (skills/experience/availability) — but actual `Service` rows (the things customers browse and book) currently have no creation endpoint at all; they only exist if seeded directly into the database.

This means: to test the full customer booking flow today, a Service must be seeded manually (ask me to do it) after a Category and Technician exist. If you want technicians to be able to list their own services through the API, that's a small additional module (`POST/PATCH/DELETE /api/technician/services`) — let me know if you'd like that built next.

---

## Full end-to-end run order (everything built so far, in the order it was actually tested)

1. `POST /api/users/register` (role: TECHNICIAN) → `POST /api/auth/login` as technician
2. `PUT /api/technician/profile`
3. `PUT /api/technician/availability`
4. *(ask me to seed a Category + a Service for this technician — no API for this yet)*
5. `POST /api/users/register` (role: CUSTOMER, or omit role) → `POST /api/auth/login` as customer
6. `GET /api/categories`, `GET /api/services`, `GET /api/technicians/:id` — browse
7. `POST /api/bookings` → save `bookingId`
8. `GET /api/technician/bookings` (as technician) — see the new REQUESTED booking
9. `PATCH /api/technician/bookings/:id` with `{"status":"ACCEPTED"}`
10. `POST /api/payments/create` (as customer) → get `checkoutUrl`, pay with Stripe test card `4242 4242 4242 4242`
11. Complete the webhook via `npm run stripe:webhook` (or ask me to simulate the confirmation) — booking flips to `PAID`
12. `PATCH /api/technician/bookings/:id` with `{"status":"IN_PROGRESS"}`
13. `PATCH /api/bookings/:id/cancel` (as customer) — **confirm this now correctly fails** with 400, since cancellation is blocked once IN_PROGRESS
14. `PATCH /api/technician/bookings/:id` with `{"status":"COMPLETED"}`
15. `POST /api/reviews` (as customer)
16. `GET /api/technicians/:id` — confirm the review appears
17. As Admin: `GET /api/admin/users`, `PATCH /api/admin/users/:id` (ban the customer), confirm `GET /api/users/me` now 403s for that customer, then unban and confirm access returns
18. As Admin: `GET /api/admin/bookings`, `GET /api/admin/categories`, `POST /api/admin/categories`

Every one of these 18 steps was run against a real database during this build, using two technicians, two customers, and one admin account, to also confirm the cross-user/cross-role authorization boundaries (wrong technician, wrong customer, wrong role) all return the correct 403/400 — not just the happy path. All test data has since been wiped; the database is empty and ready for you to start fresh.
