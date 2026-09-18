# Database Schema

This document outlines the Supabase PostgreSQL database implementation for MealMate.

## Overview
The database relies on PostgreSQL within the Supabase ecosystem. The backend `server` interacts with the database via the Supabase JS client using a Service Role Key, intentionally bypassing Row Level Security (RLS) to enforce all business logic and authorization within the Node.js Express layer.

## Tables

### 1. `users`
Core user identity table.
- `id`: UUID (Primary Key, matches Auth identity if external auth is used, otherwise custom UUID)
- `full_name`: VARCHAR
- `email`: VARCHAR (Unique)
- `password_hash`: VARCHAR
- `created_at`: TIMESTAMP

### 2. `groups`
Represents isolated multi-tenant groups.
- `id`: SERIAL (Primary Key)
- `name`: VARCHAR
- `invite_code`: VARCHAR(6) (Unique)
- `created_at`: TIMESTAMP

### 3. `group_members`
Junction table mapping users to groups and defining RBAC.
- `id`: SERIAL (Primary Key)
- `group_id`: INT (Foreign Key to `groups.id`)
- `user_id`: UUID (Foreign Key to `users.id`)
- `role`: ENUM ('admin', 'member', 'pending')
- `is_active`: BOOLEAN
- `joined_at`: TIMESTAMP
- *Unique Constraint*: `(group_id, user_id)`

### 4. `meal_prices`
Stores historical pricing configuration for groups.
- `id`: SERIAL (Primary Key)
- `group_id`: INT (Foreign Key to `groups.id`)
- `meal_type`: ENUM ('morning', 'afternoon', 'night')
- `price`: DECIMAL(10,2)
- `effective_from`: DATE
- `created_at`: TIMESTAMP
- *Unique Constraint*: `(group_id, meal_type, effective_from)`

### 5. `attendance`
Records individual meal consumption.
- `id`: SERIAL (Primary Key)
- `group_id`: INT (Foreign Key to `groups.id`)
- `user_id`: UUID (Foreign Key to `users.id`)
- `date`: DATE
- `meal_type`: ENUM ('morning', 'afternoon', 'night')
- `created_at`: TIMESTAMP
- *Unique Constraint*: `(group_id, user_id, date, meal_type)`

## Important Business Rules

### Attendance Ownership
**Rule:** A user can only modify their own attendance.
**Enforcement:** This is strictly enforced by the backend Express controllers. The `user_id` parameter passed to the `toggle_attendance` RPC is invariably derived from `req.user.id` (the authenticated JWT identity). Even an administrator cannot modify another user's attendance logs.

### Group Isolation
**Rule:** Users must only access data belonging to groups they are authorized to access.
**Enforcement:** The `requireGroupMember` Express middleware intercepts requests and queries the `group_members` table. If the `req.user.id` does not have an active (`is_active = true`) membership with a role of `admin` or `member` for the requested `group_id`, the request is immediately rejected (`403 Forbidden`).

### Historical Pricing
**Rule:** Attendance is calculated using the price effective on the date of the attendance.
**Enforcement:** Stored Procedure (RPC) `get_monthly_summary` handles this. It joins the `attendance` table against the `meal_prices` table using a lateral join (or correlated subquery) to find the most recent price where `effective_from <= attendance.date`. This guarantees accurate financial roll-ups even if prices change mid-month.

## RPC Functions (Stored Procedures)

### `toggle_attendance`
Optimized PostgreSQL function designed to toggle (upsert or delete) an attendance record in a single atomic transaction.
- **Parameters:** `p_group_id`, `p_user_id`, `p_date`, `p_meal_type`
- **Behavior:** If the record exists, it deletes it. If it does not exist, it inserts it.

### `get_monthly_summary`
Aggregates total expenditures per member for a specific group and month.
- **Parameters:** `p_group_id`, `p_month_start`, `p_month_end`
- **Behavior:** Matches every attendance record in the date range with its historically accurate price, aggregates the totals, and groups the results by `user_id`.
