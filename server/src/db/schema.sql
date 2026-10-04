CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  planned_amount numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (planned_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (budget_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  spent_at date NOT NULL,
  note varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS categories_budget_id_idx ON categories(budget_id);
CREATE INDEX IF NOT EXISTS expenses_budget_id_idx ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON expenses(category_id);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");