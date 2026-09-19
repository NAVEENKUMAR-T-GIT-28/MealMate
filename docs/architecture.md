# System Architecture

This document describes the high-level architecture of the MealMate system.

## Overall System Architecture

MealMate is architected as a multi-client ecosystem supported by a centralized, stateless REST API backend.

```text
                    ┌────────────────────────┐
                    │      Clients           │
                    │                        │
                    │  [web/]      [mobile/] │
                    └────┬─────────────┬─────┘
                         │             │
                         │             │ (Future/Deferred)
                         ▼             ▼
                    ┌────────────────────────┐
                    │       [server/]        │
                    │  (Node.js / Express)   │
                    │                        │
                    │   - Validation (Zod)   │
                    │   - Authentication     │
                    │   - Business Logic     │
                    │   - DB Integration     │
                    └──────────┬─────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │       Database         │
                    │ (Supabase PostgreSQL)  │
                    └────────────────────────┘
```

### CURRENT FOCUS
The current, production-verified pipeline is strictly:
**`web` → `server` → `Supabase/PostgreSQL`**

### FUTURE FOCUS
The `mobile` component will utilize the exact same `server` pipeline in a deferred development phase.

## Request Flow
1. **Client Initiation:** The client (e.g., Web SPA) dispatches an HTTP request. For authenticated routes, it automatically includes an HttpOnly cookie containing the JWT.
2. **Cache Check (TanStack Query):** Before reaching the network, TanStack Query checks the in-memory cache. If fresh cached data exists for the query key, it is returned immediately without an API call. If the data is stale, a background revalidation is triggered while the cached data is shown.
3. **Express Ingress:** The `server` receives the request. It first passes through `helmet` and `cors` middleware for security hardening.
4. **Zod Validation:** The `validate.js` middleware intercepts the request. It parses `req.body`, `req.query`, and `req.params` against strict Zod schemas. Invalid payloads are immediately rejected (`400 Bad Request`).
5. **Authentication (`auth.js`):** The `requireAuth` middleware verifies the JWT signature using `JWT_SECRET`. It extracts `req.user.id` to establish the authenticated identity.
6. **Authorization (RBAC):** For protected routes, `requireGroupMember` or `requireGroupAdmin` performs a real-time Postgres query to ensure the authenticated user has legitimate access rights to the requested `groupId`.
7. **Controller Logic:** The specific controller processes the verified data, applying business rules (e.g., historical pricing resolution).
8. **Database Execution:** The controller queries Supabase PostgreSQL via the backend Service Role Key.
9. **Response & Cache Update:** A JSON response is returned to the client. TanStack Query stores the response in the cache for the corresponding query key.

## Authentication Flow
MealMate uses a unified JWT authentication strategy designed to securely support both browser-based and native environments.

1. **Web:** The server issues an `HttpOnly`, `SameSite: Strict`, `Secure` cookie upon login/signup. The browser attaches this cookie automatically to subsequent requests. The Javascript layer never has access to the token, completely mitigating XSS vector theft.
2. **Mobile (Future):** The server's `requireAuth` middleware is programmed to fall back to inspecting the `Authorization: Bearer <token>` header if a cookie is absent. The mobile client will explicitly manage and attach this token.

## Authorization Flow
Authorization is enforced purely by the backend. No client-side state is trusted.
- **Identity:** Bound immutably to the verified JWT signature.
- **Data Access:** Bound to active `group_members` entries in Postgres.
- **Mutations:** Hardcoded against `req.user.id` (e.g., users can only ever toggle their own attendance rows).

## High-Level Data Flow
1. **Groups:** The central organizational unit. Users belong to Groups.
2. **Prices:** Bound to a Group. Defined with an `effective_from` date (Historical Pricing).
3. **Attendance:** Bound to a Group, a User, a Date, and a Meal Type.
4. **Summaries:** Computed asynchronously on the backend. When a client requests a summary for a given month, the server calculates the specific attendance records multiplied by the exact active price for that specific date.
