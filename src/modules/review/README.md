# Review module

A customer's review of a completed booking. One review per booking.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `POST` | `/api/reviews` | CUSTOMER (owner) | `{ bookingId, rating (1-5), comment? }` | Review a COMPLETED booking; 409 on a second review. |
