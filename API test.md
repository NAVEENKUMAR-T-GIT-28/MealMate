# MealMate v2 API Test Guide (Postman)

This guide provides sample requests you can use to test the MealMate v2 backend API using Postman or any other API client (like Insomnia or cURL).

## Base URL
All requests should be made to: `http://localhost:4000/api`

## Authentication Setup
For any route other than Signup and Login, you must provide a valid JWT token in the request headers:
**Header Name:** `Authorization`
**Header Value:** `Bearer <your_jwt_token_here>`

---

## 1. Auth API

### 1.1 Signup
*   **Method:** `POST`
*   **URL:** `/auth/signup`
*   **Headers:** `Content-Type: application/json`
*   **Body (JSON):**
    ```json
    {
      "full_name": "Test User",
      "email": "test@example.com",
      "password": "password123"
    }
    ```

### 1.2 Login
*   **Method:** `POST`
*   **URL:** `/auth/login`
*   **Headers:** `Content-Type: application/json`
*   **Body (JSON):**
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
    > **Note:** Copy the `token` from the response to use in the `Authorization` header for the following requests.

### 1.3 Get Current User Profile
*   **Method:** `GET`
*   **URL:** `/auth/me`
*   **Headers:** `Authorization: Bearer <token>`

---

## 2. Groups API

### 2.1 Create a Group
*   **Method:** `POST`
*   **URL:** `/groups`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Body (JSON):**
    ```json
    {
      "name": "My Roommates"
    }
    ```

### 2.2 Join a Group
*   **Method:** `POST`
*   **URL:** `/groups/join`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Body (JSON):**
    ```json
    {
      "invite_code": "A1B2C3" 
    }
    ```
    > *(Replace "A1B2C3" with a real invite code generated from the Create Group step).*

### 2.3 Get My Groups
*   **Method:** `GET`
*   **URL:** `/groups/mine`
*   **Headers:** `Authorization: Bearer <token>`

### 2.4 Get Group Details (Members List)
*   **Method:** `GET`
*   **URL:** `/groups/:id` *(Replace `:id` with your actual group ID, e.g., `/groups/1`)*
*   **Headers:** `Authorization: Bearer <token>`

### 2.5 Regenerate Invite Code (Admin Only)
*   **Method:** `POST`
*   **URL:** `/groups/:id/regenerate-code`
*   **Headers:** `Authorization: Bearer <token>`

---

## 3. Meal Prices API

### 3.1 Get Price History
*   **Method:** `GET`
*   **URL:** `/groups/:id/prices`
*   **Headers:** `Authorization: Bearer <token>`

### 3.2 Add New Meal Price (Admin Only)
*   **Method:** `POST`
*   **URL:** `/groups/:id/prices`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Body (JSON):**
    ```json
    {
      "meal_type": "morning",
      "price": 50.00,
      "effective_from": "2023-10-01"
    }
    ```
    > *(Valid `meal_type` values: "morning", "afternoon", "night")*

---

## 4. Attendance API

### 4.1 Toggle Meal Attendance
*   **Method:** `PUT`
*   **URL:** `/attendance/toggle`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Body (JSON):**
    ```json
    {
      "group_id": 3,
      "date": "2023-10-15",
      "meal_type": "morning"
    }
    ```

### 4.2 Get Attendance for a Month
*   **Method:** `GET`
*   **URL:** `/attendance?group_id=3&month=YYYY-MM` *(e.g., `/attendance?group_id=3&month=2023-10`)*
*   **Headers:** `Authorization: Bearer <token>`
*   **Optional Query Params:**
    *   `member_id`: Pass a specific member ID (e.g., `&member_id=2`) to fetch data for only one person.
    
    > **Architecture Note:** The main Attendance calendar view (`/attendance`) fetches the entire group's data at once by omitting `member_id`. This allows instant, zero-lag switching between members' calendars on the frontend without extra loading screens or network requests. The Member Detail view (`/summary/2`) uses the `member_id` parameter to optimize its fetch for a single person.

---

## 5. Summary API

### 5.1 Get Monthly Cost Summary
*   **Method:** `GET`
*   **URL:** `/groups/:id/summary?month=YYYY-MM` *(e.g., `/groups/1/summary?month=2023-10`)*
*   **Headers:** `Authorization: Bearer <token>`
