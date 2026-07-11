# User module

The user account resource: register, self-manage profile & password, and admin user-management — all operations on a user record live here regardless of role.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `POST` | `/api/users/register` | public | `{ name, email, password, phone, role? }` | Create a CUSTOMER (default) or TECHNICIAN; technician also gets an empty profile. |
| `GET` | `/api/users/me` | any logged-in user | — | Return own profile. |
| `PATCH` | `/api/users/update-profile` | any logged-in user | `{ name?, phone?, bio?, profilePhoto?, address? }` | Update own user + profile fields. |
| `PATCH` | `/api/users/update-password` | any logged-in user | `{ oldPassword, newPassword }` | Change own password. |
| `GET` | `/api/admin/users` | ADMIN | — (query: page, limit, role, searchTerm) | List every user; passwords omitted. |
| `PATCH` | `/api/admin/users/:id` | ADMIN | `{ activeStatus: "ACTIVE" | "BLOCKED" }` | Ban / unban a user; effective immediately. |

> Admin user-management is served from `/api/admin/*` (see `admin` module for the router), but documented here because it operates on the user resource.
