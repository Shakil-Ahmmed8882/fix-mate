# Technician self-service module

A logged-in technician managing their own profile, weekly availability, and the bookings assigned to them. Mounted at `/api/technician/*`.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `PUT` | `/api/technician/profile` | TECHNICIAN | `{ skills?, experienceYears?, isAvailable? }` | Update own technician profile. |
| `PUT` | `/api/technician/availability` | TECHNICIAN | `{ slots: [{ dayOfWeek, startTime, endTime }] }` | Replace the ENTIRE weekly schedule. |
| `GET` | `/api/technician/bookings` | TECHNICIAN | — (query: page, limit, status) | List bookings assigned to this technician. |
| `PATCH` | `/api/technician/bookings/:id` | TECHNICIAN (assigned) | `{ status }` | Drive the booking state machine (accept/decline/start/complete). |

> In Postman these are grouped under **Technicians** (profile/availability) and **Bookings** (the booking ones) by resource.
