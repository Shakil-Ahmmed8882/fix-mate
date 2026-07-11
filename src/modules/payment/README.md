# Payment module

Paying for an accepted booking via Stripe Checkout, plus reading payment records.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `POST` | `/api/payments/create` | CUSTOMER (owner) | `{ bookingId }` | Open a Stripe checkout for an ACCEPTED booking; returns checkoutUrl. |
| `POST` | `/api/payments/confirm` | Stripe (webhook) | raw Stripe event + signature | Signed webhook; moves booking to PAID. |
| `GET` | `/api/payments` | CUSTOMER | — (query: page, limit, status) | List own payments. |
| `GET` | `/api/payments/:id` | CUSTOMER (owner) | — | Get one own payment. |
