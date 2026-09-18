# MealMate Web Application

## Overview
This is the official Web Application for MealMate, designed to provide a comprehensive UI for managing food expense tracking, group attendance, and historical pricing. It is built as a Single Page Application (SPA) that consumes the `server` API.

## Technology Stack
- **Framework:** React.js
- **Build Tool:** Vite
- **Routing:** React Router (v6)
- **HTTP Client:** Axios
- **Styling:** Vanilla CSS (App.css, scoped component CSS)
- **State Management:** Context API (`AuthContext`, `GroupContext`, `ThemeContext`)

## Directory Structure
- `src/api/`: Axios client configuration and modular API service methods.
- `src/components/`: Reusable, stateless UI components (e.g., Modals, Navigation, Tables).
- `src/context/`: Global React Context providers (Auth, Groups, Theme).
- `src/pages/`: Top-level route components representing full application views.
- `src/utils/`: Helper functions for date formatting, mathematical operations, etc.

## Application Architecture
The web application follows a standard React SPA pattern. The root `App` component mounts global providers (`ThemeProvider`, `AuthProvider`, `GroupProvider`). A `ProtectedRoute` wrapper secures internal pages from unauthenticated access. 

## Routing
The application utilizes the following core routes:
- `/` - Landing Page (Public)
- `/signup` - Registration Page (Public)
- `/login` - Login Page (Public)
- `/groups` - Group Management (Protected)
- `/attendance` - Group Attendance Calendar (Protected)
- `/prices` - Historical Pricing config (Protected, Admin capabilities)
- `/summary` - Monthly Group Expense Roll-up (Protected)
- `/summary/:memberId` - Detailed Individual Expense Breakdown (Protected)
- `/settings` - Profile Settings (Protected)

## State Management
State is localized when possible (e.g., active modal flags, form inputs) and elevated to Context only when globally relevant:
- **`AuthContext`**: Manages the currently logged-in `user` entity. Evaluates initial authentication status upon app mount.
- **`GroupContext`**: Manages the `currentGroup` the user is actively viewing/editing, fetching group details instantly when selected.
- **`ThemeContext`**: Handles Dark/Light mode toggling via DOM dataset attributes.

## API Integration
The application communicates exclusively with the REST endpoints located in `../server/`.
- Axios is configured with `withCredentials: true` to seamlessly pass cross-origin cookies.
- All requests are strictly JSON-based.

## Authentication
Authentication strictly relies on server-issued, cryptographically secure `HttpOnly` cookies.

**Flow:**
1. Browser sends credentials via `POST /api/auth/login`.
2. Server validates credentials and returns a `Set-Cookie` header containing the JWT (HttpOnly, Secure, SameSite: Strict).
3. The frontend receives the response. **The frontend CANNOT and DOES NOT read the JWT.**
4. Subsequent Axios requests automatically attach the cookie.
5. On hard refresh, the `AuthProvider` immediately issues a `GET /api/auth/me` request. If successful, the session is restored. If it fails, the user is redirected to `/login`.

## Data Flow
- **Users**: Fetched via `/auth/me` on load.
- **Groups**: Fetched via `/groups` and stored in `GroupContext`. 
- **Attendance**: The `AttendancePage` queries the server for the active month. The data strictly reflects the Postgres table. State toggles emit a `PUT /attendance/toggle` to the server before updating locally.
- **Prices**: Fetched directly from the server.
- **Summaries**: Roll-ups are calculated purely on the backend. The frontend merely displays the aggregated totals from `/summary/:month`.

## Development
Run the web application locally:
```bash
# Install dependencies
pnpm install

# Start Vite development server
pnpm dev
```

## Environment Variables
The application relies on the following environment variables (defined in `.env`):
- `VITE_API_URL`: The fully qualified URL of the backend server API (e.g., `http://localhost:5000/api`).

*(No secrets are ever stored in the web environment configuration).*

## Current Status
- **Implemented:** Full authentication flow, secure HttpOnly sessions, multi-tenant group switching, attendance toggling, pricing management, and monthly summaries.
- **Future Work:** Excel/PDF Data Exports, Advanced Charting.
