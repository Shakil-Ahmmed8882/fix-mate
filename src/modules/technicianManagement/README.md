# Technician self-service module

A logged-in technician managing their own profile, dated availability slots, their own service listings, and the bookings assigned to them. Mounted at `/api/technician/*`.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `PUT` | `/api/technician/profile` | TECHNICIAN | `{ skills?, experienceYears?, isAvailable? }` | Update own technician profile. |
| `GET` | `/api/technician/availability` | TECHNICIAN | — | List own availability slots (rich time output). |
| `PUT` | `/api/technician/availability` | TECHNICIAN | `{ slots: [{ date, startTime, endTime }] }` | Replace ALL slots. Dated single-day slots, 12h `"hh:mm AM/PM"`; rejects past dates & overlaps with a readable conflict error. |
| `POST` | `/api/technician/services` | TECHNICIAN | `{ title, description?, price, categoryId }` | Create a service listing the technician offers (404 if category missing). |
| `PATCH` | `/api/technician/services/:id` | TECHNICIAN (owner) | `{ title?, description?, price?, categoryId?, isActive? }` | Update own service; 403 if not the owner. |
| `DELETE` | `/api/technician/services/:id` | TECHNICIAN (owner) | — | Delete own service; deactivates instead (`isActive: false`) if it has bookings. |
| `GET` | `/api/technician/bookings` | TECHNICIAN | — (query: page, limit, status) | List bookings assigned to this technician. |
| `PATCH` | `/api/technician/bookings/:id` | TECHNICIAN (assigned) | `{ status }` | Drive the booking state machine (accept/decline/start/complete). |

> A **Service** belongs to the technician who offers it (it carries their `technicianId` + `price`), so the technician owns its full lifecycle. In Postman these are grouped by resource: profile/availability under **User**, service ops under **Services**, and booking ops under **Bookings**.
>
> **Availability slots** are concrete dated windows (`{ date: "2026-08-15", startTime: "09:00 AM", endTime: "05:00 PM" }`), one calendar day each — not a recurring weekday. Stored internally as 24h `"HH:mm"` + a DATE; returned as a rich object `{ display, hour, minute, period, time24 }`. No two slots may overlap on the same date.
