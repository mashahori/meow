# 💸 Budget Planner

### Plan your budget, track your expenses, and stay in control of your finances

Budget Planner helps you manage budgets, allocate planned amounts to
categories, and keep track of expenses. The project includes a web client and
an authenticated REST API backed by PostgreSQL.

🚀 **Demo:** https://meow-budget-mashahori.msk1.amvera.tech/

[![Node.js](https://img.shields.io/badge/Node.js-22.12%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## ✨ Features

- 🔐 Register and sign in with secure session-based authentication.
- 🗓️ Create and edit budgets with date ranges and currencies.
- 🗂️ Organize planned amounts into categories.
- 🧾 Add and manage expenses.
- 📊 Review planned, spent, and remaining amounts.
- 🗄️ Manage the database schema with PostgreSQL migrations.
- ☁️ Build and deploy with Docker on Amvera Cloud.

## 🧰 Tech stack

| Area | Technologies |
| --- | --- |
| Client | React, TypeScript, Vite, React Router, TanStack Query |
| Server | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Authentication | Express Session, PostgreSQL session store |
| Server tests | Jest |
| Deployment | Docker, Amvera Cloud |

## 🚀 Getting started

### Prerequisites

- Node.js 24.21.0 or later
- PostgreSQL 14 or later
- npm

### 1. Create a database

Create a local database:

```powershell
createdb -U postgres budget_planner
```

Alternatively, run this in `psql`:

```sql
CREATE DATABASE budget_planner;
```

### 2. Configure and start the server

Copy the example environment file and update `server/.env` with your local
PostgreSQL connection details:

```powershell
cd server
Copy-Item .env.example .env
```

Set the values in `server/.env`:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/budget_planner
SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters-long
```

Replace the database username and password with your own. `SESSION_SECRET`
must be a unique random value of at least 32 characters. Never commit real
credentials or secrets to Git.

Install dependencies, apply the migrations, and start the server:

```powershell
npm install
npm run migrate
npm run build
npm start
```

The API will be available at `http://localhost:3000`.

### 3. Start the client

In a separate terminal, from the project root:

```powershell
cd client
npm install
npm run dev
```

Open the URL printed by Vite (by default, `http://localhost:5173`). During local
development, Vite proxies API requests to the server on port `3000`.

## 🧪 Quality checks

Run these commands from the relevant directory.

**Server** (`server`):

```powershell
npm test
npm run compile
npm run lint
npm run format:check
```

**Client** (`client`):

```powershell
npm run compile
npm run lint
npm run format:check
npm run build
```

Run `npm run format` to format files automatically.

## ☁️ Deploy to Amvera Cloud

The repository is configured to build a Docker image from the project root. The
image builds the client and server; the server serves the client app and runs
pending database migrations when the container starts.

1. Create a PostgreSQL database in Amvera and get its connection string.
2. Create an application connected to this repository and use the repository
   root as the build root (where `Dockerfile` and `amvera.yml` are located).
3. Set the following application environment variables:
   - `DATABASE_URL` — the PostgreSQL connection string.
   - `SESSION_SECRET` — a unique random secret of at least 32 characters.
4. Start a build and assign a domain to the application.

The container sets `NODE_ENV=production` and `PORT=3000`. Keep the database as a
separate resource so its data persists across deployments.

## 📚 Documentation

- [API documentation](server/docs/api.md)
- [Data model](server/docs/data-model.md)
- [SQL schema](server/src/db/schema.sql)
- [Database migrations](server/src/db/migrations)

## 🗂️ Project structure

```text
client/                    React client
server/                    Express API
server/src/db/migrations/  PostgreSQL migrations
server/docs/               API and data model documentation
```

---

Made to make planning your spending a little easier 💚
