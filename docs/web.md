# Web Application Architecture

This document outlines the architecture and design patterns of the MealMate React Single Page Application (SPA).

## General Architecture
The web application (`web/`) is built using React.js and Vite. It serves as a responsive, client-side rendered interface that orchestrates HTTP communication with the centralized `server/` API. 

## Structure
- **React/Vite Core**: Leverages Vite for fast HMR and optimized production bundling.
- **Components (`src/components/`)**: Houses reusable, highly cohesive UI components (e.g., Modals, Data Tables, Month Navigators).
- **Pages (`src/pages/`)**: Route-level components mapping to specific URLs (e.g., `DashboardPage`, `SummaryPage`).
- **Contexts (`src/context/`)**: Providers wrapping the React tree to inject global state downwards.
- **API Client (`src/api/`)**: Centralized Axios configuration and service modules abstracting HTTP calls.

## Routing
Client-side routing is managed via `react-router-dom` (v6).
The application relies on a `ProtectedRoute` wrapper component. This wrapper subscribes to the `AuthContext` and restricts access to internal routes (`/groups`, `/attendance`, `/summary`, etc.) by redirecting unauthenticated users to `/login`.

## State & Context Architecture
State management avoids heavy external libraries (like Redux) in favor of native React Contexts, keeping the bundle lean.

1. **AuthContext**: The source of truth for the authenticated `user`.
2. **GroupContext**: Maintains the `currentGroup` state, allowing the user to seamlessly switch between different multi-tenant environments. Changing the `currentGroup` cascades updates throughout the application.
3. **ThemeContext**: Manages light/dark visual mode preferences.

## Authentication & Session Flow
The Web application employs a highly secure, JavaScript-agnostic authentication flow designed to eliminate XSS token theft vectors.

1. **Login:** User submits credentials.
2. **Cookie Reception:** The `server` responds with a standard `200 OK` and a `Set-Cookie` header containing the JWT marked as `HttpOnly`. 
3. **Implicit Attachments:** Axios is globally configured with `withCredentials: true`. The browser automatically attaches the HttpOnly cookie to every subsequent API request to `server/`.
4. **Session Hydration:** On application initialization (or hard refresh), `AuthContext` triggers a `GET /api/auth/me` request. If the server successfully reads the cookie and validates the JWT, it returns the user profile, seamlessly hydrating the frontend session. If the request fails (e.g., token expired), the frontend resets to an unauthenticated state.

## Frontend / Backend Relationship
The frontend acts purely as a presentation and interaction layer. 
- **No Mock Data:** The UI does not invent business data. If the backend returns empty arrays, the UI renders empty states. 
- **No Security Enforcement:** While the UI hides administrative elements (like "Remove Member" buttons) for non-admins to improve UX, it does not rely on UI hiding for security. The backend performs the definitive RBAC validation.

## Current Web Status
- The web app is fully functional, supporting secure authentication, multi-tenant group switching, instantaneous attendance toggling, pricing configuration, and precise monthly expense summaries.
- Mobile compatibility is not currently supported by this specific codebase; the `mobile/` directory houses a separate, currently deferred React Native implementation.
