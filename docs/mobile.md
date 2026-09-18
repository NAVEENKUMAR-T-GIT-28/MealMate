# Mobile Architecture

This document describes the intended architecture for the MealMate mobile application (`mobile/`).

> [!WARNING]
> **Current Status: Planned / Deferred**
> The mobile application is currently frozen and out of scope while the web and server components are stabilized. The architecture outlined below documents the *intended* future state based on current structural observations.

## Overview
MealMate Mobile will serve as the native iOS and Android client for the MealMate system.

## Proposed Architecture
- **Framework:** React Native + Expo
- **Routing:** Expo Router (File-based routing)
- **API Communication:** Designed to interact seamlessly with the centralized `server/` Node.js REST API.

## Authentication Compatibility
Because native mobile applications cannot utilize `HttpOnly` web cookies in the same automated manner as a browser, the MealMate backend API was explicitly architected to support dual-authentication channels.

**Intended Mobile Flow:**
1. The mobile app posts credentials to `/api/auth/login`.
2. The server responds with the `token` in the JSON payload.
3. The mobile app stores this token securely (e.g., via `expo-secure-store`).
4. For all subsequent requests, the mobile app injects the token into the HTTP headers:
   `Authorization: Bearer <token>`
5. The backend `requireAuth` middleware is already programmed to accept this Bearer token fallback.

## Current Development Status
- **Authentication:** `Not Yet Implemented` (Needs migration to Bearer token flow).
- **Group Management:** `Not Yet Implemented`.
- **Attendance Toggling:** `Not Yet Implemented`.
- **Offline Capabilities:** Originally designed as an offline SQLite app, the mobile codebase requires substantial refactoring to synchronize with the new centralized backend API architecture. This effort is `Planned` for a future development phase.
