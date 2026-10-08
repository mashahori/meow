# Budget Planner

An application for budget planning and expense tracking.

## Project Structure

- `client` - React + TypeScript + Vite frontend
- `server` - Express + TypeScript + PostgreSQL backend
- `server/src` - Server source code (routes, controllers, services, repositories, middleware)
- `server/test` - Server unit and integration tests (Jest)
- `server/docs` - API and data model documentation
- `server/src/db/migrations` - SQL database migrations

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm (included with Node.js)

## Database Setup

Create a PostgreSQL database:

```powershell
createdb -U postgres budget_planner
```

Or run this command in `psql`:

```sql
CREATE DATABASE budget_planner;
```

## Server Setup

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Set the values in `server/.env`:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://postgres:password@localhost:5432/budget_planner
SESSION_SECRET=your-secret-key-at-least-32-chars
```

> **Note**: `SESSION_SECRET` is required for signing session ID cookies.

## Migrations

Run the migrations from the `server` directory:

```powershell
npm run migrate
```

The migrations create and update the following tables:

- `users` — user accounts with authentication and optional `active_budget_id`
- `budgets` — budgets with date ranges and status (`active`, `archived`)
- `categories` — budget categories with planned amounts
- `expenses` — recorded expenses linked to budgets and categories
- `session` — PostgreSQL session storage for Express sessions
- `schema_migrations` — tracks applied migration files

Existing migrations in `server/src/db/migrations`:

- `001_initial.sql` — initial schema (`users`, `budgets`, `categories`, `expenses`, and indexes)
- `002_sessions.sql` — `session` table for `connect-pg-simple`
- `003_active_budget.sql` — adds `active_budget_id` foreign key column to `users`

Running the migration command is idempotent; already applied migrations are skipped automatically.

Add schema changes as sequential files in `server/src/db/migrations`, for example:

```text
004_add_budget_currency.sql
```

Do not modify migrations that have already been applied.

## Running the Server

```powershell
cd server
npm run build
npm start
```

The server will be available at `http://localhost:3000`.

### Server Quality Checks & Tests

Run tests:

```powershell
npm test
```

Type checking, linting, and formatting:

```powershell
npm run compile
npm run lint
npm run format:check
```

Format code:

```powershell
npm run format
```

## Client Setup & Running

In a separate terminal:

```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev
```

Configure `client/.env` if needed:

```env
VITE_API_URL=http://localhost:3000
```

The client will be available at `http://localhost:5173`.

### Client Quality Checks

```powershell
cd client
npm run compile
npm run lint
npm run format:check
npm run build
```

## Implemented API Endpoints

All endpoints except registration and login require an authenticated session cookie.

### Authentication (`/api/auth`)

- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — log in and establish session
- `POST /api/auth/logout` — log out and destroy session
- `GET /api/auth/me` — get current authenticated user profile

### Budgets (`/api/budgets`)

- `GET /api/budgets` — list user's budgets with calculated planned, spent, and remaining totals
- `POST /api/budgets` — create a new budget (the first created budget automatically becomes active)
- `GET /api/budgets/active` — get the current active budget
- `PUT /api/budgets/active` — set active budget (`{ "budgetId": "..." }`)
- `GET /api/budgets/:budgetId` — get budget details including category summaries
- `PATCH /api/budgets/:budgetId` — update budget name or dates
- `DELETE /api/budgets/:budgetId` — archive budget (soft delete)

## Seed Data

The project currently includes database structure migrations, but a separate seed command has not been added yet. Test records can be created through the API or SQL after running the migrations.

## Documentation

- [API](server/docs/api.md)
- [Data Model](server/docs/data-model.md)
- [Complete SQL Schema](server/src/db/schema.sql)
- Migrations:
  - [001_initial.sql](server/src/db/migrations/001_initial.sql)
  - [002_sessions.sql](server/src/db/migrations/002_sessions.sql)
  - [003_active_budget.sql](server/src/db/migrations/003_active_budget.sql)

