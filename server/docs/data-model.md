# Data Model

## User

| Поле | Тип | Ограничения |
|---|---|---|
| id | UUID | primary key |
| email | varchar(255) | unique, not null |
| password_hash | varchar(255) | not null |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

## Budget

| Поле | Тип | Ограничения |
|---|---|---|
| id | UUID | primary key |
| user_id | UUID | FK -> users.id |
| name | varchar(100) | not null |
| start_date | date | not null |
| end_date | date | not null |
| status | varchar(20) | active / archived |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

## Category

| Поле | Тип | Ограничения |
|---|---|---|
| id | UUID | primary key |
| budget_id | UUID | FK -> budgets.id |
| name | varchar(100) | not null |
| planned_amount | numeric(12,2) | >= 0 |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

Ограничение: уникальная пара `(budget_id, name)`.

## Expense

| Поле | Тип | Ограничения |
|---|---|---|
| id | UUID | primary key |
| budget_id | UUID | FK -> budgets.id |
| category_id | UUID | FK -> categories.id |
| amount | numeric(12,2) | > 0 |
| spent_at | date | not null |
| note | varchar(500) | nullable |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |