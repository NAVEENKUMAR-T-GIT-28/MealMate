# MealMate v2 API — Postman Test Guide

This guide provides the exact JSON payloads and HTTP requests to test all your endpoints. You can import these directly into Postman or run them via `curl` in your terminal. 

*Assume your server is running at `http://localhost:5000`.*

---

## 1. Authentication (`/api/auth`)

### 1.1 Signup
Create a new user account.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/signup`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "full_name": "Naveen Kumar",
  "email": "naveen@example.com",
  "password": "password123"
}
```
> [!IMPORTANT]  
> Save the `token` from the response. You will need it for all the requests below! In Postman, go to **Authorization** -> select **Bearer Token** -> paste the token.

### 1.2 Login
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "email": "naveen@example.com",
  "password": "password123"
}
```

### 1.3 Get Current User
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/auth/me`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

---

## 2. Groups (`/api/groups`)

### 2.1 Create a Group
Creates a group and makes you the `admin`. Also automatically creates the base prices (₹0) for today.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/groups`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`, `Content-Type: application/json`
* **Body:**
```json
{
  "name": "Sunshine PG"
}
```
> [!NOTE]  
> Save the `id` (this is your `group_id`) and `invite_code` from the response.

### 2.2 Join a Group
*Requires logging in as a DIFFERENT user to test properly.*
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/groups/join`
* **Headers:** `Authorization: Bearer <USER_2_TOKEN>`, `Content-Type: application/json`
* **Body:**
```json
{
  "invite_code": "ENTER_CODE_HERE"
}
```

### 2.3 Get My Groups
Lists all groups the authenticated user belongs to.
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/groups`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

### 2.4 Get Group Members
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/groups/1/members` *(Replace `1` with your group ID)*
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

---

## 3. Prices (`/api/prices`)

### 3.1 Get All Prices for Group
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/prices?group_id=1`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

### 3.2 Add New Price (Admin Only)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/prices`
* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
* **Body:**
```json
{
  "group_id": 1,
  "meal_type": "morning",
  "price": 40.00,
  "effective_from": "2025-06-01"
}
```
> [!TIP]  
> You can change `meal_type` to `"afternoon"` or `"night"` and run this again to set all three prices.

---

## 4. Attendance (`/api/attendance`)

### 4.1 Toggle a Meal (Upsert)
This endpoint toggles the meal status (if it was `false` it becomes `true`, if it didn't exist it is created as `true`).
* **Method:** `PUT`
* **URL:** `http://localhost:5000/api/attendance/toggle`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`, `Content-Type: application/json`
* **Body:**
```json
{
  "group_id": 1,
  "date": "2025-06-01",
  "meal_type": "morning"
}
```

### 4.2 Get Attendance for a Month
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/attendance?group_id=1&month=2025-06`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

### 4.3 Get Attendance for a Specific Day
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/attendance?group_id=1&date=2025-06-01`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`

---

## 5. Summary (`/api/summary`)

### 5.1 Get Monthly Summary
Calculates exact costs for all members using the date-effective pricing logic.
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/summary/2025-06?group_id=1`
* **Headers:** `Authorization: Bearer <YOUR_TOKEN>`
