CREATE TABLE IF NOT EXISTS active_budgets (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  activated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, budget_id)
);

INSERT INTO active_budgets (user_id, budget_id)
SELECT id, active_budget_id FROM users WHERE active_budget_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE users DROP COLUMN IF EXISTS active_budget_id;
