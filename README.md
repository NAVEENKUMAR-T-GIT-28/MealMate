# MealMate

## Overview
MealMate is a comprehensive multi-tenant food expense and attendance tracking system. It eliminates the friction of managing shared meal logs for groups, roommates, and organizations by tracking daily attendance (morning, afternoon, night) and historical pricing per meal, calculating exact monthly expenditures and per-user balances.

## Current Project Status
**The current development priority is the WEB application and SERVER.**

> [!NOTE]
> Mobile development is intentionally deferred until the web application reaches a stable, feature-complete production status. The `mobile/` directory contains an unverified React Native implementation that is currently out of scope.

## Architecture
The MealMate ecosystem is designed for multi-client access backed by a centralized API.

```text
                    ┌───────────────┐
                    │    MealMate   │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
              web/                  mobile/
                │                       │
                └──────────┬────────────┘
                           │
                        server/
                           │
                    Supabase/Postgres
```

*(Note: The current implementation focus strictly follows the `web -> server -> Supabase/Postgres` pipeline)*

## Repository Structure
- `web/`: The React + Vite web application.
- `server/`: The Node.js + Express backend API.
- `mobile/`: The React Native + Expo application (Currently frozen/deferred).
- `docs/`: Permanent technical documentation for the system.

## Technology Stack
- **Web Frontend:** React, Vite, React Router, Axios, Context API, Vanilla CSS.
- **Backend API:** Node.js, Express.js, Zod, Helmet.
- **Database:** Supabase PostgreSQL.
- **Authentication:** Custom JWT with `bcrypt`.

## Core Features
- **Secure Authentication:** JWT-based user signup and login.
- **Multi-Tenant Groups:** Users can create isolated groups or join via a 6-character invite code.
- **Attendance Tracking:** Daily logging of morning, afternoon, and night meals.
- **Historical Pricing:** Group admins can set effective prices for specific meals starting from specific dates.
- **Automated Summaries:** Accurate monthly roll-ups calculating total group expenses and individual member contributions based on precise historical pricing.

## Authentication
Authentication is fully handled by the `server/`. It uses `bcrypt` for password hashing and issues cryptographically signed JSON Web Tokens (JWT). For the web client, these tokens are securely injected into `HttpOnly`, `SameSite: strict` cookies, rendering them immune to XSS theft. 

## Security
- **Data Boundaries:** Group membership is strictly verified by Postgres via backend middleware for every request.
- **Attendance Ownership:** A user can exclusively log or modify their *own* attendance. Even Group Admins cannot alter another user's logs.
- **Input Validation:** All API inputs are rigorously checked via `Zod` schema validation before touching business logic.
- **Headers:** Express is secured globally with `helmet`.

## Development
To run the project locally, boot both the web application and the server:

**Terminal 1 (Server):**
```bash
cd server
pnpm install
pnpm dev
```

**Terminal 2 (Web):**
```bash
cd web
pnpm install
pnpm dev
```

## Documentation
For deep technical insights, refer to the following resources:
- [Technical Documentation Index](docs/README.md)
- [Web Application README](web/README.md)
- [Server API README](server/README.md)
- [Mobile Application README](mobile/README.md)