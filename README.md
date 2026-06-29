# StartupForge Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org)
[![Express Version](https://img.shields.io/badge/express-v5.2.1-green.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.3.0-%234ea94b.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Better Auth](https://img.shields.io/badge/Better--Auth-v1.6.20-orange.svg)](https://better-auth.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

Professional backend server API powering the StartupForge team-building ecosystem. The server provides role-based authentication using Better Auth, session-based token persistence via custom JWT and HTTPOnly cookies, a flexible MongoDB layer, and integrated Stripe subscription processing.

## Architecture

The server follows a decoupled layered routing design that coordinates requests from client webhooks or REST triggers through pipeline middlewares down to database storage operations.

```
Client App (Next.js)
       │
       ▼
 ┌───────────┐
 │ ExpressJS │  [Port 5000]
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │   CORS    │  [Credential validation]
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │ JWT/Auth  │  [verifyToken.js & verifyRole.js]
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │  Routes   │  [src/routes/*.routes.js]
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │  MongoDB  │  [MongoClient - startupforge db]
 └───────────┘
```

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express (v5.2.1)
- **Database**: MongoDB Driver (v7.3.0)
- **Authentication**: Better Auth (v1.6.20) with MongoDB adapter
- **Security**: jsonwebtoken (v9.0.3), cookie-parser (v1.4.7), CORS, HTTPOnly cookies
- **Payments**: Stripe Node SDK (v22.2.3)
- **Environment**: dotenv (v17.4.2)
- **Process Manager**: Nodemon (v3.1.14) for local development

## API Base URL

- **Development Base URL**: `http://localhost:5000`
- **Production Base URL**: `https://startup-forge-server-phi.vercel.app`

## Authentication

The application uses a hybrid authentication model:
1. **Better Auth**: Handles primary registration, credentials-based sign-in, Google Social Account Linking, and social provider authorization.
2. **HTTPOnly Cookie JWT**: Upon successful login, the client requests a custom JWT (`POST /api/custom-auth/jwt`) containing the user's role and blocking status, which is stored in a cookie named `token` with `httpOnly: true`, `secure: false` (for development), and `sameSite: "lax"` properties.
3. **Role-Based Access Control (RBAC)**: Custom middlewares check request credentials to verify session validity and authorize specific user roles.
   - `verifyToken.js`: Extracts the token from incoming cookies or Authorization headers, decodes it, verifies with the DB if the account is active, and blocks blacklisted users.
   - `verifyRole.js`: Enforces page access boundaries according to standard user roles (`founder`, `collaborator`, `admin`).

## Database Collections

The MongoDB database contains five core collections:

### users
Stores user profile information, role designations, subscription statuses, and block parameters.
- `_id`: `ObjectId` (Primary Key)
- `name`: `String` (User display name)
- `email`: `String` (Unique email)
- `image`: `String` (ImgBB photo URL)
- `role`: `String` (`founder`, `collaborator`, `admin`)
- `bio`: `String` (Brief introductory description)
- `skills`: `String` / `Array` (Skill sets profile)
- `github`: `String` (Github link)
- `portfolio`: `String` (Personal website)
- `isBlocked`: `Boolean` (Account ban state)
- `isPremium`: `Boolean` (Subscription status flag for founders)
- `createdAt`: `Date` (Timestamp of sign up)
- `updatedAt`: `Date` (Timestamp of last update)

### startups
Holds founder startup profiles and team listings.
- `_id`: `ObjectId`
- `founder_email`: `String` (Owner's unique identifier)
- `startup_name`: `String`
- `status`: `String` (`pending`, `approved`)
- `team_members`: `Array` of member objects:
  - `user_email`: `String`
  - `name`: `String`
  - `portfolio`: `String`
  - `role`: `String`
  - `joined_at`: `Date`
- `createdAt`: `Date`

### opportunities
Represents postings for recruitment opportunities.
- `_id`: `ObjectId`
- `founder_email`: `String`
- `role_title`: `String`
- `startup_name`: `String`
- `work_type`: `String` (e.g. `Remote`, `Hybrid`, `On-site`)
- `industry`: `String`
- `commitment_level`: `String` (e.g. `Part-time`, `Full-time`)
- `required_skills`: `String` / `Array` (Skills required for the role)
- `deadline`: `Date` (Application close date)
- `description`: `String`
- `createdAt`: `Date`

### applications
Tracks application histories.
- `_id`: `ObjectId`
- `opportunity_id`: `String`
- `founder_email`: `String`
- `startup_name`: `String`
- `role_title`: `String`
- `applicant_email`: `String`
- `applicant_name`: `String`
- `applicant_photo`: `String`
- `portfolio`: `String`
- `status`: `String` (`Pending`, `Accepted`, `Rejected`)
- `applied_at`: `Date`

### payments
Stores premium subscription invoice logs.
- `_id`: `ObjectId`
- `user_email`: `String`
- `amount`: `Number` (Charged amount in USD)
- `payment_status`: `String` (`Paid`)
- `transaction_id`: `String` (Stripe reference)
- `paid_at`: `Date`

## API Endpoints

### Auth Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/custom-auth/jwt` | Create and set JWT token cookie | Public | Any | Signs token with `email`, `role`, `isBlocked` |
| POST | `/api/custom-auth/logout` | Clear token cookie | Public | Any | Clears `token` cookie |
| ALL | `/api/auth/*splat` | Better Auth handlers | Public | Any | Node handler for Better Auth actions |

### Users Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/users` | Add user record on registration | Public | Any | Initialises `isBlocked: false` |
| GET | `/api/users` | List all users | Yes | `admin` | |
| GET | `/api/users/:email` | Get user record by email | Public | Any | |
| PATCH | `/api/users/:email` | Update own profile | Yes | Owner | Updates custom profile fields |
| PATCH | `/api/users/block/:id` | Block a user | Yes | `admin` | Sets `isBlocked: true` |
| PATCH | `/api/users/unblock/:id` | Unblock a user | Yes | `admin` | Sets `isBlocked: false` |
| PATCH | `/api/users/role/:id` | Update user role | Yes | `admin` | Modifies user role |

### Startups Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/startups` | Create startup entry | Yes | `founder` | Maximum 1 startup allowed per founder |
| GET | `/api/startups` | List all approved startups | Public | Any | Filtered by `status: "approved"` |
| GET | `/api/startups/admin/all` | List all startups | Yes | `admin` | Displays both pending and approved |
| GET | `/api/startups/founder/:email` | Get founder's startups | Yes | `founder` | Email must match logged-in user |
| PATCH | `/api/startups/approve/:id` | Approve startup entry | Yes | `admin` | Sets `status: "approved"` |
| GET | `/api/startups/team/:email` | Get startup team members | Yes | `founder` | |
| GET | `/api/startups/:id` | Get details & opportunities | Public | Any | Combines details and active job listings |
| PATCH | `/api/startups/:id` | Update startup details | Yes | `founder`, `admin` | Cannot modify founder email or ID |
| DELETE | `/api/startups/:id` | Delete startup profile | Yes | `founder`, `admin` | |

### Opportunities Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/opportunities` | Post recruitment opportunity | Yes | `founder` | Free founders limited to 3 postings max |
| GET | `/api/opportunities/founder/:email` | Get founder opportunities | Yes | `founder` | Sorted by latest |
| GET | `/api/opportunities` | Get paginated opportunities | Public | Any | Supports search, filtering & page offset |
| GET | `/api/opportunities/dashboard/:email` | Get dashboard opportunity stats | Yes | `founder` | Aggregates application and member counts |
| GET | `/api/opportunities/:id` | Get opportunity details | Public | Any | |
| PATCH | `/api/opportunities/:id` | Update opportunity details | Yes | `founder` | |
| DELETE | `/api/opportunities/:id` | Delete opportunity | Yes | `founder`, `admin` | |

### Applications Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/applications` | Apply to an opportunity | Yes | `collaborator` | Prevents duplicate applications |
| GET | `/api/applications/user/:email` | Get collaborator applications | Yes | `collaborator` | Displays user application history |
| GET | `/api/applications/founder/:email` | Get applications for founder | Yes | `founder` | Sorted by date applied |
| PATCH | `/api/applications/:id` | Accept or reject application | Yes | `founder` | If accepted, appends to startup team |
| GET | `/api/applications/check` | Check if already applied | Yes | `collaborator` | Query param `opportunity_id` |
| DELETE | `/api/applications/:id` | Delete application record | Yes | Any | Allowed for founder, applicant, or admin |

### Payments Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/payments/create-checkout-session` | Create Stripe checkout session | Yes | `founder` | Returns Stripe Checkout redirect URL |
| POST | `/api/payments` | Record successful payment | Yes | `founder` | Grants `isPremium: true` to user |
| GET | `/api/payments` | Get payment logs | Yes | `admin` | Sorted by newest |

### Dashboard Analytics Endpoints

| Method | Endpoint | Description | Auth Required | Role Allowed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/dashboard/admin` | Retrieve system-wide stats | Yes | `admin` | Combines users, startups, and payment numbers |
| GET | `/api/public-stats` | Retrieve public count statistics | No | Public | Returns totals for active startups, opportunities, and collaborators |

## Validation

Input parameters and request body schemas are validated by the router handlers:
- **Duplicates checks**: The server enforces unique email records in registrations, single startup restrictions, and checks for prior applications (`opportunity_id` + `applicant_email` uniqueness).
- **Type conversions**: Standard MongoDB object conversions safely cast IDs using `ObjectId` constructors, returning appropriate error structures for corrupt formatting.

## Error Handling

All failed operations return structured JSON errors with consistent formats to aid clients in diagnosing bad inputs or session expiries.
Standard error response format:
```json
{
  "success": false,
  "message": "Error details explaining what went wrong"
}
```

Standard HTTP status codes are implemented:
- `400 Bad Request` - Missing parameters, validation failures, or business constraints exceeded.
- `401 Unauthorized` - Missing session token, invalid signature, or token expired.
- `403 Forbidden` - Insufficient privileges (RBAC blocks), account is blocked, or subscription required.
- `404 Not Found` - Document or record identifier does not exist.
- `500 Internal Server Error` - Database connection failures or unhandled runtime crashes.

## Pagination

Opportunities listings endpoint (`GET /api/opportunities`) supports server-side pagination to minimize data payloads:
- **Query parameters**:
  - `page`: target page number (defaults to `1`)
  - `limit`: items per page (defaults to `6`)
- **Pagination metadata**: Returns data matching the following JSON signature:
  ```json
  {
    "success": true,
    "data": [...],
    "total": 45,
    "currentPage": 1,
    "totalPages": 8
  }
  ```

## Search

The backend uses a case-insensitive MongoDB Regex search on titles and keywords matching titles and required skill tags:
```javascript
if (search) {
  query.$or = [
    { role_title: { $regex: search, $options: "i" } },
    { required_skills: { $regex: search, $options: "i" } }
  ];
}
```

## Filtering

Multi-select categories filtering uses the MongoDB `$in` operator to parse and filter opportunity attributes matching comma-delimited strings:
```javascript
if (workType) {
  query.work_type = { $in: workType.split(",") };
}
if (industry) {
  query.industry = { $in: industry.split(",") };
}
```

## Environment Variables

To run this project, add a `.env` file in the root directory of the server with the following environment variables:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_CLIENT_URL=
```

*Note: Never upload the `.env` file to your version control systems.*

## Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB Database Instance (Atlas or Local)

### Steps
1. Clone the repository and navigate to the backend subdirectory:
   ```bash
   git clone <repository-url>
   cd startupforge-server
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` configuration file in the root backend folder.
4. Run the development server (runs nodemon):
   ```bash
   npm run dev
   ```
5. Production launch:
   ```bash
   npm start
   ```

## Deployment

The backend server is configured for deployment on cloud services like Vercel, Render, or Railway:
1. Declare all environment variables in the host dashboard.
2. Ensure CORS origin matches your production frontend URL.
3. Keep the runtime Node version synchronized (`engines` key in package or environment config).

## Security

1. **HTTPOnly Cookies**: JWT validation tokens are stored inside HTTPOnly cookies (`token`) to prevent Cross-Site Scripting (XSS) client-side reads.
2. **CORS Protections**: Requests are constrained only to authorized host domains specified under `NEXT_PUBLIC_CLIENT_URL`.
3. **Password Security**: Managed off-host via Better Auth credentials schemas.
4. **Active Block Verification**: Every secure route request verifies against database states to block requests from blacklisted users immediately.

## Folder Structure

```
startupforge-server/
├── src/
│   ├── config/
│   │   ├── auth.js
│   │   └── db.js
│   ├── controllers/
│   │   └── startup.controller.js
│   ├── middlewares/
│   │   ├── verifyRole.js
│   │   └── verifyToken.js
│   ├── routes/
│   │   ├── application.routes.js
│   │   ├── auth.routes.js
│   │   ├── dashboardRoutes.js
│   │   ├── opportunity.routes.js
│   │   ├── payment.routes.js
│   │   ├── startup.routes.js
│   │   └── user.routes.js
│   └── server.js
├── .env
├── .gitignore
├── package-lock.json
└── package.json
```

## Upcoming Features

- **Real-Time Notification Systems**: SSE (Server-Sent Events) or WebSockets channel integrations.
- **Advanced Matchmaking**: Server-side skill matching engines calculating percentage matches between collaborator profiles and opportunity prerequisites.
- **Bookmarks Engine**: Saving opportunity records for quick collaborator recall.

## License

This project is licensed under the [ISC License](LICENSE) - see the LICENSE file for details.
