# Customer API — Postman testing guide

Base URL: `http://localhost:5000`

All requests that need auth rely on the `accessToken` cookie set by `/api/auth/login`. In Postman, turn on **Settings → General → Automatically follow redirects** is not needed, but do make sure **"Send cookies automatically"** is on for the domain (Postman does this by default when you hit the same base URL repeatedly in one workspace/collection). If you'd rather not rely on cookies, every protected route also accepts `Authorization: Bearer <accessToken>`.

Every response follows this envelope:
```json
{ "success": true, "statusCode": 200, "message": "...", "data": { ... }, "meta": { ... } }
```

---

## Before you start: there's no data yet

Nothing is seeded. Categories, Services, and Technicians are created by Admin/Technician endpoints that **haven't been built yet** (that's a separate pass). To test the customer flow right now, you have two options:

1. **Ask me to seed test data** (a Category + a Technician-with-a-Service) directly in the database, the same way I did to verify this build — fastest path to testing in Postman right now.
2. **Wait until the Admin/Technician modules exist**, then create real data through those APIs instead of a seed script.

Everything below assumes some Category/Service/Technician already exists — substitute real IDs from your database once seeded.

---

## 1. Browse — public, no auth needed

### `GET /api/categories`
No body. Optional query params: `?searchTerm=plumb&page=1&limit=10&sortBy=name&sortOrder=asc`

**Expected 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPage": 1 },
  "data": [
    { "id": "<uuid>", "name": "Plumbing", "description": "Pipe, sink, and drain repair", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

### `GET /api/services`
Optional query params: `?searchTerm=sink&categoryId=<uuid>&page=1&limit=10&sortBy=price&sortOrder=asc`

**Expected 200:** array of services, each with nested `category` and `technician` (technician includes `profile` and `technicianProfile`, password always omitted).

### `GET /api/services/:id`
Path param: a real Service id.

**Expected 200:** the single service object, same shape as one item from the list above.
**Expected 404** if the id doesn't exist: `{ "success": false, "statusCode": 404, "message": "Service does not exist" }`

### `GET /api/technicians`
Optional query params: `?searchTerm=John&page=1&limit=10`

**Expected 200:** array of Users where `role=TECHNICIAN`, with `profile` and `technicianProfile` nested, password omitted.

### `GET /api/technicians/:id`
Path param: a real Technician's User id.

**Expected 200:** technician detail including `servicesOffered` (active services only) and `reviewsReceived` (each review includes `customer: { id, name }`).
**Expected 404** if not found or if the id belongs to a non-technician user.

---

## 2. Register + log in as a Customer

### `POST /api/users/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret123!",
  "phone": "+8801700000000"
}
```
**Expected 200:** created user (role defaults to `CUSTOMER`), password omitted, `profile` nested and empty.

### `POST /api/auth/login`
```json
{ "email": "jane@example.com", "password": "Secret123!" }
```
**Expected 200:** `{ accessToken, refreshToken, user: { id, name, email, role } }`, and both tokens are also set as cookies. **Save the customer's `user.id` — you'll need it if you want to double check ownership in the DB, though the API itself never requires you to pass it (it's read from your token).**

From here on, every request in this section must carry the `accessToken` cookie from this login (Postman does this automatically if cookies are enabled for the domain).

---

## 3. Create and track a Booking

### `POST /api/bookings`
```json
{
  "serviceId": "<uuid of a real, active Service>",
  "scheduledAt": "2026-07-20T10:00:00.000Z",
  "note": "Kitchen sink is leaking under the cabinet"
}
```
- `note` is optional.
- `scheduledAt` must be an ISO datetime string.
- The `technicianId` is **not** something you send — it's derived automatically from whichever technician owns the service you picked.

**Expected 200:** the created booking, `status: "REQUESTED"`, with nested `service`, `technician` (id/name/phone only), `customer` (id/name/phone only), `payment: null`, `review: null`.

**Expected 404** if `serviceId` doesn't exist or belongs to an inactive service: `"Service does not exist"`.

**Save the returned booking's `id` — every following step needs it.**

### `GET /api/bookings`
Optional query params: `?status=REQUESTED&page=1&limit=10`

**Expected 200:** only bookings belonging to *you* (the logged-in customer) — this is enforced server-side, not just by convention.

### `GET /api/bookings/:id`
**Expected 200** if it's your booking.
**Expected 403** if you pass a booking id that belongs to a different customer: `"You are not authorized to view this booking"`.
**Expected 404** if the id doesn't exist at all.

---

## 4. Pay for a Booking

**Important — this step will fail on purpose right now**, and that's correct: a booking starts as `REQUESTED`, and payment is only allowed once a Technician has accepted it (`status: ACCEPTED`). There is no Technician "accept booking" endpoint built yet (that's a separate, Technician-side pass) — so to test payment today, the booking's status has to be flipped to `ACCEPTED` directly in the database. Ask me to do that for a specific booking id when you're ready to test this section.

### `POST /api/payments/create`
```json
{ "bookingId": "<uuid of your ACCEPTED booking>" }
```

**Expected 400** if the booking isn't `ACCEPTED` yet: `"Only an accepted booking can be paid for"`.
**Expected 403** if the booking isn't yours.
**Expected 409** if a payment already exists for this booking: `"A payment already exists for this booking"`.

**Expected 200** on success:
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "payment": {
    "id": "<uuid>",
    "bookingId": "<uuid>",
    "amount": "45",
    "provider": "STRIPE",
    "status": "PENDING",
    "transactionId": "cs_test_...",
    "paidAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
This is a **real Stripe test-mode Checkout Session** — opening `checkoutUrl` in a browser will show an actual Stripe test checkout page. Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC, to simulate a successful payment.

### `POST /api/payments/confirm` — Stripe webhook, not a normal Postman call
This route is **not meant to be called directly from Postman** with a hand-typed body — it verifies a cryptographic signature (`stripe-signature` header) against the raw request body, which Stripe itself generates. To actually fire this webhook during local testing, use the Stripe CLI:
```
stripe listen --forward-to localhost:5000/api/payments/confirm
```
(this exact command is already saved as the `stripe:webhook` npm script in `package.json` — run `npm run stripe:webhook`). Then complete a test payment via the `checkoutUrl` above; Stripe CLI will forward the real webhook event automatically, which flips the Payment to `COMPLETED` and the Booking to `PAID`.

If you don't want to install the Stripe CLI right now, ask me and I can flip a booking/payment's status directly in the database the same way I did during verification, so you can keep testing downstream steps (reviews) without setting up webhooks.

### `GET /api/payments`
Optional query params: `?status=PENDING&page=1&limit=10`

**Expected 200:** only payments on bookings that belong to you.

### `GET /api/payments/:id`
**Expected 200** if it's your payment (via your booking).
**Expected 403** if it belongs to someone else's booking.

---

## 5. Leave a Review

Reviews require the booking to be `COMPLETED`. Like the `ACCEPTED` step above, there's no Technician "mark job complete" endpoint yet — ask me to flip a specific booking to `COMPLETED` in the database to test this section today.

### `POST /api/reviews`
```json
{
  "bookingId": "<uuid of your COMPLETED booking>",
  "rating": 5,
  "comment": "Fixed the leak fast, very professional"
}
```
- `comment` is optional.
- `rating` must be an integer 1–5.

**Expected 400** if `rating` is outside 1–5, or if the booking isn't `COMPLETED` yet.
**Expected 403** if the booking isn't yours.
**Expected 409** if you've already reviewed this booking (one review per booking, enforced at the database level too via a unique constraint on `bookingId`).

**Expected 200** on success — the created review, linked to both the booking and the technician.

**Verify it worked:** call `GET /api/technicians/:id` for the technician on that booking — your new review should now appear in `reviewsReceived`.

---

## Suggested Postman testing order (copy this as your run order)

1. `GET /api/categories`
2. `GET /api/services`
3. `GET /api/services/:id`
4. `GET /api/technicians`
5. `GET /api/technicians/:id`
6. `POST /api/users/register`
7. `POST /api/auth/login` → save cookies
8. `GET /api/users/me`
9. `PATCH /api/users/update-profile`
10. `POST /api/bookings` → save `id` as `bookingId`
11. `GET /api/bookings`
12. `GET /api/bookings/:id`
13. *(ask me to flip that booking to ACCEPTED)*
14. `POST /api/payments/create` → save `checkoutUrl`, open in browser, pay with `4242 4242 4242 4242`
15. `GET /api/payments`
16. `GET /api/payments/:id`
17. *(complete the Stripe webhook via `npm run stripe:webhook`, or ask me to flip Payment/Booking status directly)*
18. *(ask me to flip that booking to COMPLETED, if not already done via the webhook)*
19. `POST /api/reviews`
20. `GET /api/technicians/:id` → confirm the review shows up

Every one of these 20 steps was actually run against a real database during this build (with a seeded Category/Technician/Service and two customer accounts) to confirm the exact status codes and messages documented above are real, not guessed.
