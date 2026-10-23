ALTER TABLE budgets
  ALTER COLUMN initial_amount TYPE numeric(12, 0) USING ROUND(initial_amount);

ALTER TABLE categories
  ALTER COLUMN planned_amount TYPE numeric(12, 0) USING ROUND(planned_amount);

ALTER TABLE expenses
  ALTER COLUMN amount TYPE numeric(12, 0) USING GREATEST(1, ROUND(amount));
