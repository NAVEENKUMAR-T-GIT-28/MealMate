# REST API Documentation

This document describes the actual REST API endpoints exposed by the `server/` Node.js application.

## Authentication
All protected routes require authentication. 
- **Web Clients:** Authentication is automatically handled via `HttpOnly` cookies.
- **Mobile Clients:** Pass a standard `Authorization: Bearer <token>` header.

---

## 1. Auth API (`/api/auth`)

### `POST /api/auth/signup`
- **Auth Required:** No
- **Validation:** `full_name`, `email`, `password` (Zod)
- **Description:** Registers a new user and sets the HttpOnly cookie.

### `POST /api/auth/login`
- **Auth Required:** No
- **Validation:** `email`, `password` (Zod)
- **Description:** Authenticates a user and sets the HttpOnly cookie.

### `POST /api/auth/logout`
- **Auth Required:** No
- **Description:** Clears the HttpOnly JWT cookie.

### `GET /api/auth/me`
- **Auth Required:** Yes
- **Description:** Returns the authenticated user's profile based on the JWT payload.

### `PUT /api/auth/me`
- **Auth Required:** Yes
- **Validation:** `full_name` (Zod)
- **Description:** Updates the user's profile.

---

## 2. Groups API (`/api/groups`)

### `GET /api/groups/`
- **Auth Required:** Yes
- **Description:** Fetches all groups the authenticated user belongs to.

### `POST /api/groups/`
- **Auth Required:** Yes
- **Validation:** `name` (Zod)
- **Description:** Creates a new group and assigns the creator as an `admin`.

### `POST /api/groups/join`
- **Auth Required:** Yes
- **Validation:** `invite_code` (6 chars, Zod)
- **Description:** Requests to join a group using an invite code. Status is set to `pending`.

### `GET /api/groups/:groupId/members`
- **Auth Required:** Yes (Must be active member of `:groupId`)
- **Validation:** `groupId` (Zod)
- **Description:** Retrieves all members and their roles for the specified group.

### `DELETE /api/groups/:groupId/cancel-request`
- **Auth Required:** Yes
- **Validation:** `groupId` (Zod)
- **Description:** Cancels a pending join request.

### `PUT /api/groups/:groupId/members/:userId/admit`
- **Auth Required:** Yes (Must be Admin of `:groupId`)
- **Validation:** `groupId`, `userId` (Zod)
- **Description:** Approves a pending member.

### `PUT /api/groups/:groupId/members/:userId/status`
- **Auth Required:** Yes (Must be Admin of `:groupId`)
- **Validation:** `groupId`, `userId` (Zod)
- **Description:** Changes an active member's role (e.g., promote to admin).

### `DELETE /api/groups/:groupId/members/:userId`
- **Auth Required:** Yes (Must be Admin of `:groupId`)
- **Validation:** `groupId`, `userId` (Zod)
- **Description:** Removes a member from the group.

---

## 3. Prices API (`/api/prices`)

### `GET /api/prices`
- **Auth Required:** Yes (Must be active member of `group_id`)
- **Query Params:** `group_id` (Required, Zod)
- **Description:** Retrieves the historical pricing log for the specified group.

### `POST /api/prices`
- **Auth Required:** Yes (Must be Admin of `group_id`)
- **Body:** `group_id`, `meal_type`, `price`, `effective_from` (Zod)
- **Description:** Sets a new price for a specific meal type effective from a specific date.

---

## 4. Attendance API (`/api/attendance`)

### `GET /api/attendance`
- **Auth Required:** Yes (Must be active member of `group_id`)
- **Query Params:** `group_id`, `date` OR `month`, `member_id` (Optional) (Zod)
- **Description:** Retrieves attendance logs. If `member_id` is omitted, fetches the entire group's attendance for the specified timeframe.

### `PUT /api/attendance/toggle`
- **Auth Required:** Yes (Must be active member of `group_id`)
- **Body:** `group_id`, `date`, `meal_type` (Zod)
- **Description:** Toggles (upserts or deletes) the attendance record for the authenticated user (`req.user.id`). Users cannot toggle attendance for others.

---

## 5. Summary API (`/api/summary`)

### `GET /api/summary/:month`
- **Auth Required:** Yes (Must be active member of `group_id`)
- **Query Params:** `group_id` (Required, Zod)
- **Params:** `month` (YYYY-MM format, Zod)
- **Description:** Returns the calculated financial summary for the group for the specified month, aggregating individual expenses based on historical pricing.
