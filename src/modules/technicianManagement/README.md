# Technician self-service module

A logged-in technician managing their own profile, weekly availability, their own service listings, and the bookings assigned to them. Mounted at `/api/technician/*`.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `PUT` | `/api/technician/profile` | TECHNICIAN | `{ skills?, experienceYears?, isAvailable? }` | Update own technician profile. |
| `PUT` | `/api/technician/availability` | TECHNICIAN | `{ slots: [{ dayOfWeek, startTime, endTime }] }` | Replace the ENTIRE weekly schedule. |
| `POST` | `/api/technician/services` | TECHNICIAN | `{ title, description?, price, categoryId }` | Create a service listing the technician offers (404 if category missing). |
| `PATCH` | `/api/technician/services/:id` | TECHNICIAN (owner) | `{ title?, description?, price?, categoryId?, isActive? }` | Update own service; 403 if not the owner. |
| `DELETE` | `/api/technician/services/:id` | TECHNICIAN (owner) | — | Delete own service; deactivates instead (`isActive: false`) if it has bookings. |
| `GET` | `/api/technician/bookings` | TECHNICIAN | — (query: page, limit, status) | List bookings assigned to this technician. |
| `PATCH` | `/api/technician/bookings/:id` | TECHNICIAN (assigned) | `{ status }` | Drive the booking state machine (accept/decline/start/complete). |

> A **Service** belongs to the technician who offers it (it carries their `technicianId` + `price`), so the technician owns its full lifecycle. In Postman these are grouped under **Technicians** (profile/availability/services) and **Bookings** (the booking ones) by resource.
