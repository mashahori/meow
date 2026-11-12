CREATE TABLE category_groups (
  slug varchar(50) PRIMARY KEY,
  sort_order smallint NOT NULL UNIQUE
);

INSERT INTO category_groups (slug, sort_order)
VALUES
  ('food', 10),
  ('eating-out', 20),
  ('rent', 30),
  ('mortgage', 40),
  ('utilities', 50),
  ('communication', 60),
  ('home', 70),
  ('transport', 80),
  ('health', 90),
  ('clothing', 100),
  ('beauty', 110),
  ('children', 120),
  ('pets', 130),
  ('education', 140),
  ('sport', 150),
  ('entertainment', 160),
  ('travel', 170),
  ('gifts', 180),
  ('loan', 190),
  ('taxes', 200);

ALTER TABLE categories
  ADD COLUMN group_slug varchar(50)
    CONSTRAINT categories_group_slug_fkey
    REFERENCES category_groups(slug) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX categories_group_slug_idx ON categories(group_slug);
