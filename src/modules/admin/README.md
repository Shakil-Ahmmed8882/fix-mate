# Admin module (router only)

This folder is a thin **router** that mounts admin-only endpoints under `/api/admin/*`. The endpoints themselves belong to other resources and are documented there — this file just records what this router exposes so the code is easy to trace.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `GET` | `/api/admin/users` | ADMIN | — | List all users → see **user** module. |
| `PATCH` | `/api/admin/users/:id` | ADMIN | `{ activeStatus }` | Ban/unban → see **user** module. |
| `GET` | `/api/admin/bookings` | ADMIN | — | List all bookings → see **booking** module. |
| `GET` | `/api/admin/categories` | ADMIN | — | List categories → see **category** module. |
| `POST` | `/api/admin/categories` | ADMIN | `{ name, description }` | Create category → see **category** module. |

> Kept as a role-scoped router at the server level (auth guard in one place). In Postman these are grouped by resource, not under an Admin folder.
