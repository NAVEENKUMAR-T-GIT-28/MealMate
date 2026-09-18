# MealMate Server

## Overview
This is the core Backend API Server for MealMate. It is a Node.js/Express application responsible for all data persistence, business logic enforcement, security validation, and multi-tenant isolation. It serves as the single source of truth for the entire MealMate ecosystem (Web and Mobile).

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Database Client:** Supabase JS Client (using Service Role Key)
- **Validation:** Zod
- **Security:** Helmet, CORS, bcrypt, jsonwebtoken, cookie-parser

## Directory Structure
- `src/app.js`: Express application setup and global middleware pipeline.
- `src/routes/`: Express routers mapping URLs to specific controller functions.
- `src/controllers/`: Core business logic responding to HTTP requests.
- `src/middleware/`: Security and validation intercepts (`auth.js`, `validate.js`).
- `src/validations/`: Strict Zod schemas defining expected payload shapes.
- `src/config/`: Database connection initialization.
- `migrations/`: Raw PostgreSQL SQL scripts documenting the schema and RPC functions.

## Request Architecture
All incoming API requests follow a strict pipeline:
**Client → Express Routes → Zod Validation Middleware → Auth/RBAC Middleware → Controller Logic → Supabase/PostgreSQL**

## Authentication
Authentication relies on cryptographically signed JSON Web Tokens (JWT) and BCrypt password hashing.

- **Signup & Login:** Issues a JWT upon success.
- **HttpOnly Web Cookie:** For the web client, the token is directly injected into an `HttpOnly`, `SameSite: Strict`, `Secure` cookie.
- **Authorization Bearer:** The auth middleware explicitly supports falling back to `Authorization: Bearer <token>` headers to preserve absolute compatibility with the future mobile application.
- **`/api/auth/me`:** Validates the active session and returns the user payload.
- **Logout:** Explicitly clears the HttpOnly cookie.

*(Note: The mobile application is currently deferred, but the backend is fully capable of serving it without modification).*

## Authorization
Security is paramount. The server enforces strict Role-Based Access Control (RBAC):
- **Authenticated Identity:** Derived exclusively from the cryptographic signature of the JWT payload (`req.user.id`).
- **Group Membership:** Ensured by `requireGroupMember`. Users cannot read or write data for groups they do not belong to.
- **Admin Authorization:** Enforced by `requireGroupAdmin` for sensitive operations like updating prices or removing members.
- **Pending Member Restrictions:** Users with a `pending` role are actively blocked from data access by the middleware until an admin approves them.
- **Self-Only Attendance:** The controller logic inherently bounds attendance mutations to `req.user.id`. Users cannot modify other users' attendance, regardless of admin status.

## Validation
A centralized Zod middleware intercepts all requests. `req.body`, `req.query`, and `req.params` are structurally validated against typed schemas. If an input fails validation, a `400 Bad Request` is instantly returned, preventing malformed data from ever reaching the controllers.

## Security Middleware
- **CORS:** Restricted to verified frontends, configured specifically to permit credentialed cookie exchanges.
- **Helmet:** Sets stringent HTTP response headers to defend against well-known web vulnerabilities (XSS, Sniffing, Clickjacking).
- **Authentication/Authorization Middleware:** Fail-closed design preventing unauthorized access.

## Database Integration
The server communicates directly with a Supabase PostgreSQL database. It utilizes the `SUPABASE_SECRET_KEY` (Service Role Key), explicitly bypassing Row Level Security (RLS). This design choice centralizes all security, validation, and business logic firmly within the Node.js Express layer, guaranteeing that the API is the sole arbiter of data access.

## API Documentation
Complete API documentation is available in the permanent technical docs:
[API Documentation](../docs/api.md)

## Environment Variables
The server requires the following configuration in a `.env` file:
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`

*(Never expose the actual values of these secrets).*

## Development
Run the server locally:
```bash
# Install dependencies
pnpm install

# Start development server with auto-reload
pnpm dev
```
