# FixItNow — Home Services Marketplace

## 1. Project Overview

FixItNow is a full-stack home services marketplace that connects customers with skilled technicians for convenient service discovery, appointment booking, and secure payments. It provides role-based experiences for customers, technicians, and administrators to manage the complete service lifecycle from booking requests to reviews and platform oversight.

**Live URL:** [FixItNow-Frontend-NextJS-WebDevL2A5](https://github.com/AhmadZubayer/FixItNow-Frontend-NextJS-WebDevL2A5)

## 2. Entities

| Entity               | Responsibility                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Customer**   | Finds technicians, requests services, pays for accepted bookings, tracks jobs, and submits reviews. |
| **Technician** | Manages professional details, offered services, availability, booking requests, and job progress.   |
| **Admin**      | Oversees accounts, service approvals, categories, bookings, feedback, and platform payments.        |

## 3. User Journey

**Customer:** Register / Log in → Browse services → Search and filter technicians → View technician profile → Select services and available time slot → Submit booking request → Wait for technician approval → Pay through Stripe → Track job progress → Leave a review after completion.

**Technician:** Register / Log in → Set up technician profile → Add services and availability → Receive booking requests → Accept or decline requests → Wait for customer payment → Start the job → Mark the job completed → View earnings and payment history.

**Admin:** Log in → Open admin dashboard → Monitor platform statistics → Manage customers and technicians → Review and moderate services → Manage categories → Monitor bookings → Review feedback → Inspect payments and platform earnings.

### Booking lifecycle

`REQUESTED` → `ACCEPTED` → `PAID` → `IN_PROGRESS` → `COMPLETED`

A request may instead become `DECLINED` or `CANCELLED` where permitted by the booking workflow. A completed booking can be reviewed by its customer.

## 4. Business Logic

For every successfully completed payment:

- **Technician share:** 85% of the payment amount.
- **Platform share:** 15% of the payment amount.

## 5. Features and Routes

The following table documents the application's frontend page routes. Dynamic `[id]` segments refer to the relevant record ID.

| No. | Route URL                                    | Short description                          | Access     |
| --: | -------------------------------------------- | ------------------------------------------ | ---------- |
|   1 | `/`                                        | Explore featured services and technicians  | Public     |
|   2 | `/services`                                | Search and filter available services       | Public     |
|   3 | `/technicians/[id]`                        | View technician details and availability   | Public     |
|   4 | `/auth/login`                              | Sign in to an account                      | Public     |
|   5 | `/auth/register`                           | Create a customer or technician account    | Public     |
|   6 | `/dashboard/customer`                      | Track bookings, payments, and activity     | Customer   |
|   7 | `/dashboard/customer/payments`             | View personal payment history              | Customer   |
|   8 | `/dashboard/customer/bookings/[id]/pay`    | Open accepted booking checkout             | Customer   |
|   9 | `/dashboard/customer/bookings/[id]/review` | Review a completed service                 | Customer   |
|  10 | `/dashboard/technician`                    | View technician activity overview          | Technician |
|  11 | `/dashboard/technician/bookings`           | Manage incoming booking requests           | Technician |
|  12 | `/dashboard/technician/earnings`           | Track income and payment history           | Technician |
|  13 | `/dashboard/technician/profile`            | Manage technician profile and services     | Technician |
|  14 | `/dashboard/technician/availability`       | Manage available appointment slots         | Technician |
|  15 | `/dashboard/admin`                         | View platform statistics and health        | Admin      |
|  16 | `/dashboard/admin/users`                   | Manage customer and user accounts          | Admin      |
|  17 | `/dashboard/admin/technicians`             | Search and manage technician accounts      | Admin      |
|  18 | `/dashboard/admin/services`                | Approve, pause, and remove services        | Admin      |
|  19 | `/dashboard/admin/categories`              | Manage service categories                  | Admin      |
|  20 | `/dashboard/admin/bookings`                | Monitor platform booking records           | Admin      |
|  21 | `/dashboard/admin/payments`                | Inspect transactions and revenue shares    | Admin      |
|  22 | `/dashboard/admin/feedbacks`               | Review customer ratings and feedback       | Admin      |
|  23 | `/payment/success`                         | Show successful payment return information | Public     |
|  24 | `/payment/cancel`                          | Show cancelled checkout return information | Public     |

## 6. Project Structure

```text
FixItNow-Frontend-NextJS-WebDevL2A5/
├── app/                          # Next.js App Router
│   ├── api/                      # Internal API and session proxies
│   │   ├── admin/
│   │   │   ├── feedbacks/
│   │   │   └── health/
│   │   └── session/
│   │       └── me/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── bookings/
│   │   │   ├── categories/
│   │   │   ├── feedbacks/
│   │   │   ├── payments/
│   │   │   ├── services/
│   │   │   ├── technicians/
│   │   │   └── users/
│   │   ├── customer/
│   │   │   ├── bookings/
│   │   │   │   └── [id]/
│   │   │   │       ├── pay/
│   │   │   │       └── review/
│   │   │   └── payments/
│   │   └── technician/
│   │       ├── availability/
│   │       ├── bookings/
│   │       ├── earnings/
│   │       └── profile/
│   ├── payment/
│   │   ├── cancel/
│   │   └── success/
│   ├── services/
│   └── technicians/
│       └── [id]/
├── components/                   # Reusable interface components
│   ├── admin/                    # Admin dashboard components
│   ├── auth/                     # Authentication forms
│   ├── customer/                 # Customer booking/payment components
│   ├── reui/                     # Shared timeline components
│   ├── technician/               # Technician dashboard components
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Reusable React hooks
├── lib/                          # API clients, helpers, types
├── public/                       # Static assets and images
├── screenshots/                  # Project screenshots used in README
├── tests/                        # Browser and end-to-end tests
├── ui_references/                # UI reference assets
├── validations/                  # Zod validation schemas
├── AGENTS.md
├── PROGRESS.md
├── REQUIREMENTS.md
├── TASKS.md
├── README.md
├── components.json
├── eslint.config.mjs
├── instrumentation.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── proxy.ts
└── tsconfig.json
```

## 7. Project Specification

| Item              | Technology                                    |
| ----------------- | --------------------------------------------- |
| Frontend          | Next.js 16 (App Router), React 19, TypeScript |
| UI                | Tailwind CSS 4, shadcn/ui                     |
| API communication | Axios and Next.js route handlers              |
| Backend           | Express.js 5 with TypeScript                  |
| ORM               | Prisma 7                                      |
| Database          | PostgreSQL (Prisma Postgres)                  |
| Deployment        | Vercel via GitHub                             |
| Form validation   | Zod                                           |
| Authentication    | JWT and bcrypt                                |
| Payments          | Stripe                                        |
| API documentation | Swagger UI and OpenAPI                        |
| Logger            | Pino                                          |
| Backend build     | tsup                                          |

## 8. Project Overview


![FixItNow project screenshot 01](./screenshots/1.jpg)

![FixItNow project screenshot 02](./screenshots/2.jpg)

![FixItNow project screenshot 03](./screenshots/3.png)

![FixItNow project screenshot 04](./screenshots/4.jpg)

![FixItNow project screenshot 05](./screenshots/5.jpg)

![FixItNow project screenshot 06](./screenshots/6.jpg)

![FixItNow project screenshot 07](./screenshots/7.jpg)

![FixItNow project screenshot 08](./screenshots/7-2.jpg)

![FixItNow project screenshot 09](./screenshots/8.png)

![FixItNow project screenshot 10](./screenshots/9.png)

![FixItNow project screenshot 11](./screenshots/10.png)

![FixItNow project screenshot 12](./screenshots/11.png)

![FixItNow project screenshot 13](./screenshots/11-1.jpg)

![FixItNow project screenshot 14](./screenshots/12.png)

![FixItNow project screenshot 15](./screenshots/13.jpeg)

![FixItNow project screenshot 18](./screenshots/15.jpg)

![FixItNow project screenshot 19](./screenshots/16.jpg)

![FixItNow project screenshot 20](./screenshots/17.jpg)

![FixItNow project screenshot 22](./screenshots/19.jpg)

![FixItNow project screenshot 23](./screenshots/20.jpg)
![FixItNow project screenshot 24](./screenshots/21.jpg)
![FixItNow project screenshot 25](./screenshots/22.jpg)
![FixItNow project screenshot 26](./screenshots/23.jpg)

## 9. Project Development

Completed by **Ahmad Zubayer** during the **Next Level Development** course at **Programming Hero**.

## 10. Use of AI

**Codex** was used for formatting, brainstorming, error fixes, and code snippets in parts of this project.
