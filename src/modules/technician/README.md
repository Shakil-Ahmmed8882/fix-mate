# Technician module (public browse)

Public browsing of technicians. A technician's own profile & availability management lives in the **technicianManagement** module; booking actions live in **booking**.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `GET` | `/api/technicians` | public | — (query: page, limit, searchTerm) | List active technicians (lean — no availability slots). |
| `GET` | `/api/technicians/:id` | public | — | Get one technician with services, reviews, and `technicianProfile.availabilitySlots` (rich date/time form). |
