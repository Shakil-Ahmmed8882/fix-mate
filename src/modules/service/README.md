# Service module

Individual jobs a technician offers under a category. This module holds the **public read** side (browse/list). A service is **owned by the technician** who offers it, so its create/update/delete endpoints live in the **technicianManagement** module (`POST/PATCH/DELETE /api/technician/services`).

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `GET` | `/api/services` | public | — (query: page, limit, categoryId, searchTerm) | List active services. |
| `GET` | `/api/services/:id` | public | — | Get one service. |
| `POST` | `/api/technician/services` | TECHNICIAN | `{ title, description?, price, categoryId }` | Create a service → see **technicianManagement** module. |
| `PATCH` | `/api/technician/services/:id` | TECHNICIAN (owner) | `{ title?, price?, categoryId?, isActive? }` | Update own service → see **technicianManagement** module. |
| `DELETE` | `/api/technician/services/:id` | TECHNICIAN (owner) | — | Delete/deactivate own service → see **technicianManagement** module. |
