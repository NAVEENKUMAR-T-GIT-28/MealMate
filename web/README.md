# MealMate Web Application

## Overview
This is the official Web Application for MealMate, designed to provide a comprehensive UI for managing food expense tracking, group attendance, and historical pricing. It is built as a Single Page Application (SPA) that consumes the `server` API.

## Technology Stack
- **Framework:** React.js
- **Build Tool:** Vite
- **Routing:** React Router (v6)
- **HTTP Client:** Axios
- **Server-State Caching:** TanStack Query (React Query v5)
- **Styling:** Vanilla CSS (App.css, scoped component CSS)
- **State Management:** Context API (`AuthContext`, `GroupContext`, `ThemeContext`) for local/UI state; TanStack Query for server-state

## Directory Structure
- `src/api/`: Axios client configuration and modular API service methods.
- `src/components/`: Reusable, stateless UI components (e.g., Modals, Navigation, Tables).
- `src/context/`: Global React Context providers (Auth, Groups, Theme).
- `src/hooks/`: TanStack Query hooks (`useGroupsQuery`, `useMembersQuery`, etc.) and centralized query keys.
- `src/pages/`: Top-level route components representing full application views.
- `src/utils/`: Helper functions for date formatting, mathematical operations, etc.

## Application Architecture
The web application follows a standard React SPA pattern. The root `App` component mounts global providers (`QueryClientProvider`, `ThemeProvider`, `AuthProvider`, `GroupProvider`). A `ProtectedRoute` wrapper secures internal pages from unauthenticated access.

## Server-State Caching (TanStack Query)
The application uses TanStack Query to cache server data and eliminate redundant API calls during page/tab navigation.

### Query Keys
All query keys are centralized in `src/hooks/queryKeys.js`:
- `['me']` — Current user profile
- `['groups']` — User's groups list
- `['members', groupId]` — Members for a specific group
- `['prices', groupId]` — Price history for a group
- `['attendance', groupId, date]` — Attendance for a single date
- `['attendance', groupId, 'month', month, memberId]` — Monthly attendance
- `['summary', groupId, month]` — Monthly cost summary

### Freshness Strategy
| Query | staleTime | Rationale |
|---|---|---|
| Groups | 5 min | Groups rarely change during a session |
| Members | 5 min | Members rarely change during a session |
| Prices | 5 min | Prices change infrequently (admin action) |
| Attendance | 1 min | Changes by current user; optimistic updates provide instant feedback |
| Summary | 5 min | Computed data; explicitly invalidated after attendance/price mutations |

### Navigation Behavior
When a user navigates between tabs (e.g., Dashboard → History → Dashboard), the second Dashboard visit uses existing cached data if it is still fresh. No API request is made. This eliminates redundant database hits during normal tab switching.

### Mutation & Cache Synchronization
- **Attendance Toggle**: Uses optimistic updates — the UI reflects the change instantly, and the cache is rolled back if the server rejects the mutation. After settlement, attendance and summary queries are invalidated.
- **Price Changes**: After successful save, prices and all summary queries for the group are invalidated to recalculate.
- **Group/Member Changes**: After create/join/admit/remove operations, relevant group and member queries are invalidated.

### Window Focus
`refetchOnWindowFocus` is set to `false` globally. Switching browser tabs does not trigger API requests.

### Server Remains Authoritative
The cache is a read-state performance layer only. The backend/database hierarchy is always:
`PostgreSQL → Express → API Response → TanStack Query Cache → React UI`

## Routing
The application utilizes the following core routes:
- `/` - Redirects to Dashboard
- `/signup` - Registration Page (Public)
- `/login` - Login Page (Public)
- `/groups` - Group Management (Protected)
- `/dashboard` - Group Attendance Dashboard (Protected)
- `/summary` - Monthly Group Expense Roll-up (Protected)
- `/summary/:memberId` - Detailed Individual Expense Breakdown (Protected)
- `/history` - Historical Spending Overview (Protected)
- `/settings` - Group Settings & Price Config (Protected)
- `/profile` - User Profile & Session Management (Protected)
- `/group-settings` - Group Admin Management (Protected, Admin)

## State Management
- **`AuthContext`**: Manages the currently logged-in `user` entity. Evaluates initial authentication status upon app mount via HttpOnly cookie.
- **`GroupContext`**: Manages `currentGroup` and member data using TanStack Query internally. Actively sorts the `activeMembers` list securely in the format: Me (Current User) > Admin > Others.
- **`ThemeContext`**: Handles Dark/Light mode toggling.
- **TanStack Query**: Manages all server-state (attendance, prices, summaries, groups, members) with configurable freshness, optimistic updates, and automatic cache invalidation.

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
- **Groups**: Fetched via `useGroupsQuery` and cached. Stored in `GroupContext`.
- **Attendance**: Fetched via `useAttendanceQuery`. Optimistic updates provide instant UI feedback on toggle.
- **Prices**: Fetched via `usePricesQuery` and cached.
- **Summaries**: Fetched via `useSummaryQuery` and cached. Invalidated when attendance or prices change.

## Realtime Limitation
Supabase Realtime is not implemented. The frontend does not directly connect to Supabase. Changes made by other users are discovered through future cache revalidation (when cached data becomes stale), not through push notifications. This is documented as a possible future enhancement.

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
- **Implemented:** Full authentication flow, secure HttpOnly sessions, multi-tenant group switching, attendance toggling with optimistic updates, pricing management, monthly summaries, TanStack Query caching layer, and comprehensive Excel/PDF reporting (including padded absence tracking and alphabetical member sorting).
- **Future Work:** Supabase Realtime for cross-user live updates, Advanced Charting.
