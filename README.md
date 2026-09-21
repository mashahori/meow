# Budget Planner

An application for budget planning and expense tracking.

## Project Structure

- `client` - React + TypeScript + Vite
- `server` - Express + TypeScript + PostgreSQL
- `server/docs` - API and data model documentation
- `server/src/db/migrations` - SQL database migrations

## Requirements

- Node.js 20+
- PostgreSQL 14+

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
yarn
Copy-Item .env.example .env
```

Set the values in `server/.env`:

```env
PORT
CORS_ORIGIN
DATABASE_URL
```

## Migrations

Run the migrations from the `server` directory:

```powershell
yarn run migrate
```

The migrations create these tables:

- `users`
- `budgets`
- `categories`
- `expenses`
- `schema_migrations`

Running the command again is safe because already applied migrations are skipped.

Add schema changes as separate files in `server/src/db/migrations`, for example:

```text
002_add_budget_currency.sql
```

Do not modify migrations that have already been applied.

## Running the Server

```powershell
cd server
yarn run build
yarn start
```

The server will be available at `http://localhost:3000`.

Type checking and linting:

```powershell
yarn run compile
yarn run lint
```

## Running the Client

In a separate terminal:

```powershell
cd client
yarn
yarn dev
```

The client will be available at `http://localhost:5173`.

## Seed Data

The project currently includes database structure migrations, but a separate seed command has not been added yet. Test records can be created through the API or SQL after running the migrations.

## Documentation

- [API](server/docs/api.md)
- [Data Model](server/docs/data-model.md)
- [Initial SQL Migration](server/src/db/migrations/001_initial.sql)
