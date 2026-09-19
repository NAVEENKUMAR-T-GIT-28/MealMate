# Web Application Architecture

This document outlines the architecture and design patterns of the MealMate React Single Page Application (SPA).

## General Architecture
The web application (`web/`) is built using React.js and Vite. It serves as a responsive, client-side rendered interface that orchestrates HTTP communication with the centralized `server/` API. Server-state is managed through TanStack Query (React Query v5), providing an intelligent caching layer that eliminates redundant API calls during page navigation.

## Structure
- **React/Vite Core**: Leverages Vite for fast HMR and optimized production bundling.
- **Components (`src/components/`)**: Houses reusable, highly cohesive UI components (e.g., Modals, Data Tables, Month Navigators).
- **Pages (`src/pages/`)**: Route-level components mapping to specific URLs (e.g., `DashboardPage`, `SummaryPage`).
- **Contexts (`src/context/`)**: Providers wrapping the React tree to inject global state downwards.
- **Hooks (`src/hooks/`)**: TanStack Query hooks and centralized query key definitions.
- **API Client (`src/api/`)**: Centralized Axios configuration and service modules abstracting HTTP calls.

## Routing
Client-side routing is managed via `react-router-dom` (v6).
The application relies on a `ProtectedRoute` wrapper component. This wrapper subscribes to the `AuthContext` and restricts access to internal routes (`/groups`, `/dashboard`, `/summary`, etc.) by redirecting unauthenticated users to `/login`.

## State & Context Architecture
State management uses native React Contexts for UI/auth state and TanStack Query for server-state, keeping the bundle lean.

1. **AuthContext**: The source of truth for the authenticated `user`. Unchanged — manages session via HttpOnly cookie.
2. **GroupContext**: Maintains the `currentGroup` state. Internally uses `useGroupsQuery` and `useMembersQuery` TanStack Query hooks. Actively sorts the `activeMembers` list securely in the format: Me (Current User) > Admin > Others.
3. **ThemeContext**: Manages light/dark visual mode preferences.
4. **TanStack Query**: All server data (attendance, prices, summaries, groups, members) flows through dedicated query hooks with configurable freshness and automatic cache invalidation.

## Server-State Caching

### Query Key Strategy
All keys are centralized in `src/hooks/queryKeys.js`:
```
['groups']                                    — User's groups
['members', groupId]                          — Group members
['prices', groupId]                           — Price history
['attendance', groupId, date]                 — Daily attendance
['attendance', groupId, 'month', month, mid]  — Monthly attendance
['summary', groupId, month]                   — Monthly summary
```

### Freshness & Staleness
- Groups, Members, Prices, Summaries: **5 minutes** staleTime
- Attendance: **1 minute** staleTime (higher frequency due to user actions)
- `refetchOnWindowFocus`: **false** globally (no surprise refetches on tab switch)

### Page Navigation Caching
When navigating Dashboard → History → Dashboard, the second Dashboard visit uses fresh cached data immediately without an API call. This eliminates the repeated `useEffect` → API → Database cycle that previously occurred on every component remount.

### Mutation & Invalidation
- **Attendance Toggle** (`useToggleAttendance`): Optimistic update on `onMutate` → rollback on `onError` → invalidate attendance + summary on `onSettled`
- **Price Save** (`useSavePrices`): Invalidates prices + all summaries for the group on `onSuccess`
- **Group/Member Mutations**: Invalidate `['groups']` or `['members', groupId]` as appropriate

### Optimistic Updates
The attendance toggle implements a full optimistic update cycle:
1. Cancel in-flight attendance query
2. Snapshot previous cached data
3. Optimistically toggle the meal boolean in the cache
4. Execute the API mutation
5. On error: rollback to snapshot
6. On settle: invalidate to sync with server truth

## Authentication & Session Flow
The Web application employs a highly secure, JavaScript-agnostic authentication flow designed to eliminate XSS token theft vectors.

1. **Login:** User submits credentials.
2. **Cookie Reception:** The `server` responds with a standard `200 OK` and a `Set-Cookie` header containing the JWT marked as `HttpOnly`.
3. **Implicit Attachments:** Axios is globally configured with `withCredentials: true`. The browser automatically attaches the HttpOnly cookie to every subsequent API request to `server/`.
4. **Session Hydration:** On application initialization (or hard refresh), `AuthContext` triggers a `GET /api/auth/me` request. If the server successfully reads the cookie and validates the JWT, it returns the user profile, seamlessly hydrating the frontend session. If the request fails (e.g., token expired), the frontend resets to an unauthenticated state.

## Frontend / Backend Relationship
The frontend acts purely as a presentation and interaction layer.
- **No Mock Data:** The UI does not invent business data. If the backend returns empty arrays, the UI renders empty states.
- **No Security Enforcement:** While the UI hides administrative elements for non-admins to improve UX, it does not rely on UI hiding for security. The backend performs the definitive RBAC validation.
- **Cache is Read-Only:** The TanStack Query cache is a performance/read-state layer. It is never authoritative. The server/database always takes precedence.

## Realtime Limitation
Supabase Realtime is not currently implemented. The frontend does not directly connect to Supabase — it communicates exclusively through the Express server via Axios. Changes made by other users in the same group are discovered only when cached data becomes stale and is revalidated, not through push notifications. The query key structure has been designed to allow Realtime integration as a future enhancement via targeted `invalidateQueries` calls.

## Current Web Status
- The web app is fully functional, supporting secure authentication, multi-tenant group switching, instantaneous attendance toggling with optimistic updates, pricing configuration, precise monthly expense summaries, Excel/PDF reporting (including padded absence tracking and alphabetical member sorting), and intelligent server-state caching.
- Mobile compatibility is not currently supported by this specific codebase; the `mobile/` directory houses a separate, currently deferred React Native implementation.
