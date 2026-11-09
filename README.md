# FixItNow Frontend

FixItNow is a home services marketplace built with Next.js. Customers can find technicians, request a service appointment, pay for accepted bookings, and leave reviews. Technicians can manage their profiles, services, availability, and jobs. Administrators can oversee users, technicians, bookings, categories, and platform payments.

## Features

- Search and filter services and technicians by category, location, price, and rating.
- View technician profiles, reviews, services, prices, and available time slots.
- Create customer bookings and follow their payment and job status.
- Manage technician profiles, services, availability, and booking requests.
- Review users, categories, bookings, technicians, and payment shares in the admin dashboard.
- Use role-based dashboards with protected routes and responsive layouts.

## Requirements

- Node.js and npm.
- Access to the FixItNow backend API.

The frontend uses `API_BASE_URL` to select the backend API. If it is not set, the app uses the configured FixItNow API endpoint.

## Setup

Install the project dependencies:

```bash
npm ci
```

Set `API_BASE_URL` in a local environment file when you need to use a different backend API. Do not commit local environment files or credentials.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build. |
| `npm run test:e2e` | Run the optional end-to-end suite against the local backend and test data. |

The end-to-end suite expects the backend repository and its local configuration. `FIXITNOW_TEST_TECH_FILE` can provide test account details. Set `FIXITNOW_MUTATION_TESTS` to `1` to enable tests that change availability. Use isolated test data for this suite.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Browse featured services and technicians. |
| `/services` | Search, filter, sort, and browse services and technicians. |
| `/technicians/[id]` | View a technician's profile, reviews, services, and booking options. |
| `/auth/login` | Sign in to an existing account. |
| `/auth/register` | Create a customer or technician account. |
| `/dashboard/customer` | Review bookings and manage customer activity. |
| `/dashboard/customer/payments` | View customer payment history. |
| `/dashboard/customer/bookings/[id]/pay` | Start payment for an accepted booking. |
| `/dashboard/customer/bookings/[id]/review` | Review a completed booking. |
| `/dashboard/technician` | Manage a technician profile, services, and availability. |
| `/dashboard/technician/bookings` | Review and update assigned booking requests. |
| `/dashboard/admin` | Review platform activity, users, bookings, and categories. |
| `/dashboard/admin/technicians` | Search and manage technician accounts. |
| `/dashboard/admin/payments` | Review platform payment shares. |
| `/payment/success` and `/payment/cancel` | View payment return information. |

## Project Structure

- `app/` contains pages, layouts, and frontend API routes.
- `components/` contains shared interface components and forms.
- `lib/` contains API clients and shared application utilities.
- `validations/` contains frontend request and form schemas.
- `tests/` contains browser and end-to-end checks.
