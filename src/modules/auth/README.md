# Auth module

Session lifecycle for an account that already exists: log in, refresh the access token, log out, read the current user. Creating an account is in the **user** module.

| Method | Path | Who | Payload | What it does |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | public | `{ email, password }` | Return access + refresh tokens. |
| `POST` | `/api/auth/refresh-token` | valid refresh cookie | — (cookie) | Issue a new access token. |
| `POST` | `/api/auth/logout` | public | — | Clear the auth cookies. |
| `GET` | `/api/auth/me` | any logged-in user | — | Return the authenticated account. |
