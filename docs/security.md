# Security Architecture

This document details the security architecture of the MealMate ecosystem.

## Authentication

### Password Hashing
All user passwords are mathematically one-way hashed using `bcrypt` before being stored in PostgreSQL. Plaintext passwords are never logged, stored, or transmitted outside of the initial HTTPS POST request payload.

### JWT (JSON Web Tokens)
Authentication state is managed via stateless JWTs.
- Signed symmetrically using the backend `JWT_SECRET`.
- Tokens encapsulate the verified identity (`user.id` and `user.email`).

### Token Delivery & Storage
1. **HttpOnly Cookies (Web):** When the web application authenticates, the JWT is returned directly inside a `Set-Cookie` header configured with `HttpOnly`, `SameSite: Strict`, and `Secure` attributes. This guarantees that the token is strictly inaccessible to frontend JavaScript, entirely neutralizing Cross-Site Scripting (XSS) token theft.
2. **Authorization Bearer (Mobile):** Native applications cannot rely on browser cookie jars. The backend retains absolute compatibility with standard `Authorization: Bearer <token>` headers, allowing mobile clients to securely manually transmit the JWT.

## Authorization (RBAC)

Authorization is strictly enforced at the backend middleware level. The UI may hide features, but the backend physically blocks them.

### Authenticated Identity
Identity is never derived from client-provided user IDs. It is extracted explicitly from the cryptographically verified JWT (`req.user.id`).

### Multi-Tenant Group Isolation
Before processing any group-related request, the `requireGroupMember` middleware executes a database query to verify that the `req.user.id` possesses an active membership mapping (`group_members`) to the requested `group_id`. If the user is unmapped, access is denied (`403 Forbidden`).

### Admin Authorization
Operations that alter group infrastructure (updating prices, removing members, approving join requests, regenerating invite codes) are guarded by `requireGroupAdmin`, which asserts that the verified user holds the `admin` role in the `group_members` table.

### Pending-User Restrictions
Users who join via invite code receive a `pending` role. The `requireGroupMember` middleware explicitly rejects requests from pending users, locking them out of group data access until an `admin` elevates them to a `member`.

### Self-Only Attendance
A fundamental system rule restricts attendance mutations strictly to the actor. The `toggle_attendance` controller logic forces the `user_id` argument to be the authenticated `req.user.id`. Even group administrators cannot toggle attendance for other members.

## API Security

### CORS (Cross-Origin Resource Sharing)
Express is configured to restrict CORS to the explicit `process.env.FRONTEND_URL` environment variable. `credentials: true` is strictly enabled for this origin to facilitate secure cookie passing.

### Helmet
The `helmet` middleware is injected globally into the Express pipeline, providing automatic, robust HTTP security headers (e.g., `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`).

### Input Validation (Zod)
All endpoints are gated by a centralized Zod validation middleware. `req.body`, `req.query`, and `req.params` are rigorously shape-checked against typed schemas. Requests containing malformed payloads, excessive lengths, or invalid types are instantly rejected with a `400 Bad Request` before reaching the application business logic.

### Parameterized Queries
All database interactions flow through the Supabase JS Client, which inherently utilizes parameterized queries under the hood, neutralizing SQL Injection (SQLi) vectors.

## Secrets Management
- **Supabase Secret Key:** The backend utilizes the `SUPABASE_SECRET_KEY` (Service Role Key) to bypass RLS and act as the absolute authority. This key lives exclusively in the `server/` environment variables.
- **JWT Secret:** Lives exclusively in the `server/` environment variables.
- **Frontend Safe Variables:** The frontend environment config (`.env`) contains ONLY safe routing values (e.g., `VITE_API_URL`).

## Accepted Limitations
- **Rate Limiting:** Rate limiting mechanisms (e.g., IP-based request throttling) are intentionally disabled and out of scope for the current architectural phase.
