ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active_budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL;
