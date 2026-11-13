# Budget Planner API

## Общая информация

Base URL:

```text
/api
```

Все запросы и ответы используют JSON, кроме ответов со статусом `204 No Content`.

Даты передаются в формате `YYYY-MM-DD`.

Денежные значения передаются строками с двумя знаками после запятой:

```json
"26000.00"
```

Авторизованные запросы используют HTTP-only cookie сессии. Для запросов из браузера frontend должен передавать credentials.

## Общие ошибки

Формат ошибки:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  }
}
```

Используемые HTTP-статусы:

| Статус | Значение                                     |
| ------ | -------------------------------------------- |
| `400`  | Некорректные данные запроса                  |
| `401`  | Пользователь не авторизован                  |
| `404`  | Ресурс не найден или недоступен пользователю |
| `409`  | Конфликт данных                              |
| `429`  | Слишком много запросов восстановления пароля |
| `500`  | Внутренняя ошибка сервера                    |

## Авторизация

### Регистрация

```http
POST /api/auth/register
Content-Type: application/json
```

Request:

```json
{
  "email": "maria@example.com",
  "password": "strong-password"
}
```

Response `201 Created`:

```json
{
  "user": {
    "id": "3f2504e0-e89b-41d4-a716-446655440000",
    "email": "maria@example.com"
  }
}
```

Ошибки: `400` если данные некорректны, `409` если email уже зарегистрирован.

### Вход

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "maria@example.com",
  "password": "strong-password"
}
```

Response `200 OK`:

```json
{
  "user": {
    "id": "3f2504e0-e89b-41d4-a716-446655440000",
    "email": "maria@example.com"
  }
}
```

Сервер устанавливает HTTP-only cookie сессии.

Ошибки: `400` если данные некорректны, `401` если email или пароль неверны.

### Запросить восстановление пароля

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

Request:

```json
{
  "email": "maria@example.com"
}
```

Response `200 OK` (одинаковый для зарегистрированных и неизвестных адресов):

```json
{
  "message": "If an account with that email exists, a reset link has been sent."
}
```

Для зарегистрированного адреса сервер отправляет одноразовую ссылку, которая
действует 30 минут. Для отправки писем необходимо настроить переменные
`CLIENT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` и
`SMTP_FROM`.

### Сменить пароль по ссылке

```http
POST /api/auth/reset-password
Content-Type: application/json
```

Request:

```json
{
  "token": "one-time-reset-token",
  "password": "new-strong-password"
}
```

Response: `204 No Content`. Ссылка становится недействительной после
использования; существующие сессии пользователя завершаются. Просроченный или
недействительный токен возвращает `401`. Запросы восстановления ограничены
пятью попытками с одного IP-адреса за 15 минут; превышение лимита возвращает
`429`.

### Текущий пользователь

```http
GET /api/auth/me
```

Требуется авторизация.

Response `200 OK`:

```json
{
  "user": {
    "id": "3f2504e0-e89b-41d4-a716-446655440000",
    "email": "maria@example.com"
  }
}
```

### Выход

```http
POST /api/auth/logout
```

Требуется авторизация.

Response: `204 No Content`.

## Бюджеты

Во всех endpoint-ах этого раздела требуется авторизация. Пользователь может работать только со своими бюджетами.
При обращении к бюджету проверяется его владелец. Несуществующий или чужой бюджет в ответах не различается и возвращает `404`.
Некорректный UUID бюджета возвращает `400`.

### Получить список бюджетов

```http
GET /api/budgets
```

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "budget-uuid",
      "name": "Июнь 2026",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "status": "active",
      "isActive": true,
      "initialAmount": "100000.00",
      "currency": "RUB",
      "plannedAmount": "66000.00",
      "spentAmount": "8500.00",
      "remainingAmount": "57500.00"
    }
  ]
}
```

### Создать бюджет

```http
POST /api/budgets
Content-Type: application/json
```

Request:

```json
{
  "name": "Июнь 2026",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "initialAmount": 100000,
  "currency": "RUB"
}
```

Response `201 Created`:

```json
{
  "id": "budget-uuid",
  "name": "Июнь 2026",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "status": "active",
  "initialAmount": "100000.00",
  "currency": "RUB"
}
```

Ошибки: `400` если название пустое или дата окончания раньше даты начала.

### Получить бюджет

```http
GET /api/budgets/:budgetId
```

Response `200 OK`:

```json
{
  "id": "budget-uuid",
  "name": "Июнь 2026",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "status": "active",
  "isActive": true,
  "initialAmount": "100000.00",
  "currency": "RUB",
  "plannedAmount": "66000.00",
  "spentAmount": "8500.00",
  "remainingAmount": "57500.00",
  "categories": []
}
```

### Изменить бюджет

```http
PATCH /api/budgets/:budgetId
Content-Type: application/json
```

Request:

```json
{
  "name": "Июнь 2026 - обновленный",
  "endDate": "2026-07-01",
  "initialAmount": 120000,
  "currency": "RUB"
}
```

Response `200 OK`: обновленный бюджет.

### Перевести бюджет в архив

```http
POST /api/budgets/:budgetId/archive
```

Тело запроса не требуется. Бюджет получает статус `archived`. Если он был активным, активный бюджет у пользователя сбрасывается.
Архивные бюджеты по-прежнему возвращаются из `GET /api/budgets` со статусом `archived`; клиент разделяет основной список и архив по этому полю.

Response `200 OK`: обновленный бюджет. Ошибки: `404` если бюджет не найден.

### Вернуть бюджет из архива

```http
POST /api/budgets/:budgetId/unarchive
```

Тело запроса не требуется. Бюджет получает статус `active`. Бюджет не становится активным автоматически: для этого используется отдельный запрос на установку активного бюджета.

Response `200 OK`: обновленный бюджет. Ошибки: `404` если бюджет не найден.

### Клонировать бюджет

```http
POST /api/budgets/:budgetId/clone
```

Тело запроса не требуется. Создает новый бюджет на основе существующего: копируются даты, `initialAmount` и `currency`, а также все категории с их плановыми суммами и группами. Расходы не копируются. Название нового бюджета формируется как `<название> (копия)` (не длиннее 100 символов). Новый бюджет создается со статусом `active` и не становится активным автоматически.

Response `201 Created`: новый бюджет. Ошибки: `404` если исходный бюджет не найден.

### Сделать бюджет активным

```http
POST /api/budgets/:budgetId/activate
```

Тело запроса не требуется. Бюджет добавляется в активные бюджеты пользователя (`isActive: true`). Другие активные бюджеты не меняются: у пользователя может быть несколько активных бюджетов.

Response `200 OK`: обновленный бюджет. Ошибки: `404` если бюджет не найден, `409` если бюджет архивирован.

### Сделать бюджет неактивным

```http
POST /api/budgets/:budgetId/deactivate
```

Тело запроса не требуется. Бюджет исключается из активных бюджетов пользователя; если нет, ничего не меняется.

Response `200 OK`: обновленный бюджет (`isActive: false`). Ошибки: `404` если бюджет не найден.

### Удалить бюджет

```http
DELETE /api/budgets/:budgetId
```

Бюджет удаляется из БД полностью вместе с его категориями и расходами. Если он был активным, у пользователя активный бюджет сбрасывается.

Response: `204 No Content`.

### Активный бюджет

У пользователя может быть несколько активных бюджетов (в списке и деталях бюджета есть поле `isActive`). Активность бюджета хранится в таблице `active_budgets`; новый бюджет не становится активным автоматически. Архивированный бюджет не может быть активным; при архивировании или удалении бюджет исключается из активных.

`GET /api/budgets/active` возвращает один бюджет: тот, который был активирован последним среди активных.

```http
GET /api/budgets/active
```

Response `200 OK`: `{ "budget": { ... } }` или `{ "budget": null }`.

```http
PUT /api/budgets/active
Content-Type: application/json
```

Request: `{ "budgetId": "budget-uuid" }`

Response `200 OK`: бюджет. Ошибки: `404` если бюджет не найден, `409` если бюджет архивирован.

## Категории

Категория принадлежит только одному бюджету. Категория из одного бюджета не может использоваться в другом.

У категории может быть группа (`groupSlug`) — системная сквозная сущность, общая для всех бюджетов и пользователей. Группа необязательна: у категории без группы `groupSlug` равен `null`. Поле `groupSlug` также присутствует у категорий в ответе `GET /api/budgets/:budgetId`.

### Получить группы категорий

```http
GET /api/category-groups
```

Требуется авторизация. Возвращает системный справочник групп в порядке `sortOrder`. Названия групп в API не передаются: клиент переводит их по `slug`.

Response `200 OK`:

```json
{
  "items": [
    { "slug": "food", "sortOrder": 10 },
    { "slug": "eating-out", "sortOrder": 20 }
  ]
}
```

Группы: `food`, `eating-out`, `rent`, `mortgage`, `utilities`, `communication`, `home`, `transport`, `health`, `clothing`, `beauty`, `children`, `pets`, `education`, `sport`, `entertainment`, `travel`, `gifts`, `loan`, `taxes`.

### Получить категории бюджета

```http
GET /api/budgets/:budgetId/categories
```

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "category-uuid",
      "budgetId": "budget-uuid",
      "name": "Продукты",
      "groupSlug": "food",
      "plannedAmount": "26000.00",
      "spentAmount": "8500.00",
      "remainingAmount": "17500.00"
    }
  ]
}
```

### Создать категорию

```http
POST /api/budgets/:budgetId/categories
Content-Type: application/json
```

Request:

```json
{
  "name": "Продукты",
  "plannedAmount": "26000.00",
  "groupSlug": "food"
}
```

`groupSlug` необязателен; его можно не передавать или передать `null`.

Response `201 Created`: созданная категория.

Ошибки: `400` если сумма отрицательная или группы с таким `groupSlug` не существует, `404` если бюджет не найден, `409` если категория с таким названием уже существует в этом бюджете.

Для создания и получения категорий бюджета требуется авторизация и владение бюджетом. В ответе списка присутствуют `budgetId`, `groupSlug`, `plannedAmount`, `spentAmount` и `remainingAmount`.

### Изменить категорию

```http
PATCH /api/categories/:categoryId
Content-Type: application/json
```

Request:

```json
{
  "name": "Продукты и бытовые товары",
  "plannedAmount": "28000.00",
  "groupSlug": "home"
}
```

Response `200 OK`: обновленная категория.

Требуется авторизация. Можно передать `name`, `plannedAmount`, `groupSlug` или любое их сочетание; категория должна принадлежать пользователю. `groupSlug: null` убирает группу у категории; если поле не передано, группа не меняется. Ошибки: `400` при некорректных данных или UUID либо если группы с таким `groupSlug` не существует, `404` если категория не найдена, `409` если в этом бюджете уже есть категория с таким названием.

### Удалить категорию

```http
DELETE /api/categories/:categoryId
```

Требуется авторизация. Удалить можно только категорию своего бюджета.
Вместе с категорией удаляются все её расходы. Операция выполняется в одной транзакции.

Response: `204 No Content`. Ошибки: `404` если категория не найдена.

## Расходы

### Получить расходы бюджета

```http
GET /api/budgets/:budgetId/expenses
```

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "expense-uuid",
      "budgetId": "budget-uuid",
      "categoryId": "category-uuid",
      "amount": "8500.00",
      "spentAt": "2026-06-15",
      "note": "Покупки на неделю"
    }
  ]
}
```

### Получить расходы категории

```http
GET /api/categories/:categoryId/expenses
```

Требуется авторизация. Возвращаются расходы категории только из бюджетов текущего пользователя.

### Создать расход

```http
POST /api/budgets/:budgetId/expenses
Content-Type: application/json
```

Request:

```json
{
  "categoryId": "category-uuid",
  "amount": "8500.00",
  "spentAt": "2026-06-15",
  "note": "Покупки на неделю"
}
```

Response `201 Created`: созданный расход.

Ошибки: `400` если сумма не больше нуля или дата вне периода бюджета, `404` если бюджет или категория не найдены.

### Изменить расход

```http
PATCH /api/expenses/:expenseId
Content-Type: application/json
```

Request:

```json
{
  "categoryId": "other-category-uuid",
  "amount": "9000.00",
  "note": "Обновленная сумма"
}
```

Все поля необязательны, но хотя бы одно должно быть передано. `categoryId` переносит расход в другую категорию того же бюджета.

Response `200 OK`: обновленный расход.

### Удалить расход

```http
DELETE /api/expenses/:expenseId
```

Response: `204 No Content`.

## Бизнес-правила

1. Пользователь видит только свои бюджеты, категории и расходы.
2. Бюджет принадлежит одному пользователю.
3. Категория принадлежит одному бюджету.
4. Название категории уникально внутри одного бюджета.
5. Расход должен ссылаться на категорию того же бюджета.
6. Сумма категории не может быть отрицательной.
7. Сумма расхода должна быть больше нуля.
8. Дата расхода должна попадать в период бюджета.
9. `remainingAmount = plannedAmount - spentAmount`.
10. Все денежные значения хранятся в PostgreSQL как `numeric(12,2)`.
11. `password_hash` никогда не возвращается клиенту.
