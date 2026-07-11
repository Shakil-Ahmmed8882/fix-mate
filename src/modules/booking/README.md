# Booking module

The booking lifecycle for every role that touches it — customer create/read/cancel, technician progression, admin oversight.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `POST` | `/api/bookings` | CUSTOMER | `{ serviceId, scheduledAt, note? }` | Create a booking; technician derived from the service. |
| `GET` | `/api/bookings` | CUSTOMER | — (query: page, limit, status) | List own bookings. |
| `GET` | `/api/bookings/:id` | CUSTOMER (owner) | — | Get one own booking. |
| `PATCH` | `/api/bookings/:id/cancel` | CUSTOMER (owner) | — | Cancel before IN_PROGRESS. |
| `GET` | `/api/technician/bookings` | TECHNICIAN | — (query: page, limit, status) | List assigned bookings. (technicianManagement module) |
| `PATCH` | `/api/technician/bookings/:id` | TECHNICIAN | `{ status }` | Progress the state machine. (technicianManagement module) |
| `GET` | `/api/admin/bookings` | ADMIN | — (query: page, limit, status) | List every booking. (admin module) |

State machine: `REQUESTED → ACCEPTED | DECLINED`, `ACCEPTED → PAID` (via payment), `PAID → IN_PROGRESS → COMPLETED`, and `CANCELLED` from any pre-IN_PROGRESS state.
