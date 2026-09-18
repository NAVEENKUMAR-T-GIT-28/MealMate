# MealMate Mobile Application

## Current Status
**Planned / Deferred**

The mobile development phase of the MealMate project is intentionally deferred. The current project priority is the stabilization, hardening, and production deployment of the **Web** and **Server** components.

This directory (`mobile/`) contains the React Native + Expo shell. It is strictly frozen in its current state.

## Overview
MealMate Mobile will eventually serve as the native iOS and Android client for the MealMate ecosystem. 

## Architecture (Planned)
- **Framework:** React Native + Expo (Expo Router).
- **Network Client:** Designed to communicate natively with the centralized `server/` API.
- **Authentication Compatibility:** The backend API has already been designed to seamlessly support the mobile client using standard `Authorization: Bearer <token>` headers, ensuring the exact same JWT logic powers both Web and Mobile.

## Important Note
The mobile application is **out of scope** for the current development phase. It has not been structurally verified against the finalized backend API routes and features. It will be revisited in a dedicated future development phase.