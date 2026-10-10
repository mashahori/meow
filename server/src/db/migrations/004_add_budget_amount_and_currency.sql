CREATE TABLE currencies (
  code char(3) PRIMARY KEY,
  name varchar(100) NOT NULL,
  symbol varchar(10) NOT NULL
);

INSERT INTO currencies (code, name, symbol)
VALUES
  ('RUB', 'Russian ruble', '₽'),
  ('USD', 'United States dollar', '$'),
  ('EUR', 'Euro', '€');

ALTER TABLE budgets
  ADD COLUMN initial_amount numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (initial_amount >= 0),
  ADD COLUMN currency char(3) NOT NULL DEFAULT 'RUB'
    REFERENCES currencies(code);

