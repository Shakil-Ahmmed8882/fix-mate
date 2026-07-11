# Service module

Individual jobs a technician offers under a category. Public read only in this build (services come from the seed script; no create/update/delete API yet).

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `GET` | `/api/services` | public | — (query: page, limit, categoryId, searchTerm) | List services. |
| `GET` | `/api/services/:id` | public | — | Get one service. |
