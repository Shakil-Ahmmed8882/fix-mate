# Category module

The service categories customers and technicians browse and filter by. Public read; admin-only create.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `GET` | `/api/categories` | public | — (query: page, limit, searchTerm) | List all categories. |
| `POST` | `/api/admin/categories` | ADMIN | `{ name, description }` | Create a category; 409 on duplicate name. |
| `GET` | `/api/admin/categories` | ADMIN | — | Same list, under the admin prefix. |

> Create / admin-list live on the `/api/admin/*` router (`admin` module) but belong to the category resource.
