## Project Overview

FixItNow is a modern, responsive **Next.js application** for a home services marketplace. Customers can browse available services, view technician profiles, and book qualified professionals for specific time slots. Technicians can build their service profiles, manage their availability via an interactive scheduler, and handle job bookings. Admins oversee the entire platform through a comprehensive moderation dashboard.

---

## Roles & Permissions

| Role                 | Description                  | Frontend UI Expectations                                                                                                                                                  |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**   | Users who book home services | Public browsing, interactive time-slot selection for bookings, payment checkout flow, booking tracking dashboard, review submission.                                      |
| **Technician** | Service professionals        | Protected technician dashboard, profile/services setup forms, interactive availability calendar/scheduler UI, booking management table (accept/decline/complete actions). |
| **Admin**      | Platform moderators          | Protected admin dashboard, user management tables (ban/unban actions), global platform statistics, service category management UI.                                        |

  **Note** : Users select their role during registration. The UI must dynamically adapt based on the authenticated user's role, and routes must be protected using  **Next.js Middleware** .

---

## Features & UI/UX Requirements

### Public Features

* **Responsive Service Grid** : Display services and top-rated technicians with optimized images (`next/image`), ratings, and starting prices.
* **Advanced Search & Filter** : Sidebar or top-bar filters for service type, location, rating, and price range with real-time UI updates.
* **Technician Profile Page** : Comprehensive view with technician bio, skills, past reviews, and an interactive "Book Now" section (with date/time pickers).
* **Loading & Error States** : Skeleton loaders for data fetching and graceful `error.tsx` fallbacks.

### Customer Features

* **Auth Flows** : Registration and login forms with validation error messages.
* **Booking Flow** : Interactive UI to select a service, choose a technician, and pick an available time slot.
* **Payment Integration** : Seamless redirect to **Stripe Checkout** or **SSLCommerz** gateway after the technician accepts the booking. Dedicated `/payment/success` and `/payment/cancel` pages.
* **Customer Dashboard** : View booking history (with status badges and a "Cancel" button for eligible bookings), payment history table, and a form to leave reviews after job completion.

### Technician Features

* **Technician Dashboard** : Overview of upcoming jobs, total earnings, and pending requests.
* **Profile & Services Management** : Forms to update skills, experience, pricing, and profile picture.
* **Availability Scheduler** : An interactive calendar or time-slot picker UI to set working hours and block out unavailable times.
* **Booking Management** : A dedicated table to view incoming requests with action buttons ("Accept", "Decline", "Mark In-Progress", "Mark Completed").

### Admin Features

* **Admin Dashboard** : Global overview of platform health (total users, active bookings, revenue).
* **User Management** : Data table of all users with search, pagination, and "Ban/Unban" action buttons.
* **Technician Management** : Data table of all technicians with search, pagination, and "Ban/Unban" action buttons.
* **Category Management** : UI to view, create, and manage service categories.
* System wide Payment History View: The admin will be able to view all payment histoy occured in the platform (Cols: No, Date & Time, Method. Customer paid, Technician Recived, Platform Earning).

## Buisness Logic:

### Upon every transaction from the user, the technician will get 85% and the platform will get 15%.

### 🔧 Customer Journey

[](https://github.com/Apollo-Level2-Web-Dev/B7A5/blob/main/3-FixItNow-Frontend.md#-customer-journey)

```
[Register/Login] → [Browse Services] → [View Technician Profile] 
       ↓
[Select Service & Time Slot] → [Submit Booking Request]
       ↓
[Wait for Technician Acceptance] → [Stripe/SSLCommerz Redirect]
       ↓
[Payment Success Page] → [Track Booking Status] → [Leave Review]
```

> **UI Focus** : The time-slot picker must clearly show available vs. booked slots. Use toast notifications for booking status changes. Ensure the "Cancel Booking" button is only visible/enabled when the status allows it (before `IN_PROGRESS`).

### 🛠️ Technician Journey

[](https://github.com/Apollo-Level2-Web-Dev/B7A5/blob/main/3-FixItNow-Frontend.md#%EF%B8%8F-technician-journey)

```
[Register/Login] → [Setup Profile & Services] → [Set Availability Calendar]
       ↓
[View Incoming Booking Requests] → [Click Accept/Decline]
       ↓
[Customer Pays] → [Mark "In-Progress"] → [Mark "Completed"]
```

> **UI Focus** : The availability scheduler should be intuitive (e.g., clicking a day to add time blocks). Use optimistic UI updates or React Query invalidation to instantly reflect booking status changes without a full page reload.







### 📊 Booking Status (UI Badges)

[](https://github.com/Apollo-Level2-Web-Dev/B7A5/blob/main/3-FixItNow-Frontend.md#-booking-status-ui-badges)

* `REQUESTED` → Yellow/Orange Badge (Technician sees Accept/Decline buttons)
* `ACCEPTED` → Blue Badge (Customer sees "Pay Now" button)
* `DECLINED` → Red Badge
* `PAID` → Purple Badge (Technician sees "Start Job" button)
* `IN_PROGRESS` → Green Badge (Technician sees "Complete Job" button; Customer cannot cancel)
* `COMPLETED` → Gray Badge (Customer sees "Leave Review" button)
* `CANCELLED` → Dark Red Badge
