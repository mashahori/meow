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

| Статус | Значение |
|---|---|
| `400` | Некорректные данные запроса |
| `401` | Пользователь не авторизован |
| `404` | Ресурс не найден или недоступен пользователю |
| `409` | Конфликт данных |
| `500` | Внутренняя ошибка сервера |

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
	"endDate": "2026-06-30"
}
```

Response `201 Created`:

```json
{
	"id": "budget-uuid",
	"name": "Июнь 2026",
	"startDate": "2026-06-01",
	"endDate": "2026-06-30",
	"status": "active"
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
	"endDate": "2026-07-01"
}
```

Response `200 OK`: обновленный бюджет.

### Архивировать бюджет

```http
DELETE /api/budgets/:budgetId
```

В MVP endpoint меняет статус бюджета на `archived`. Данные бюджета и его расходы не удаляются.

Response: `204 No Content`.

## Категории

Категория принадлежит только одному бюджету. Категория из одного бюджета не может использоваться в другом.

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
	"plannedAmount": "26000.00"
}
```

Response `201 Created`: созданная категория.

Ошибки: `400` если сумма отрицательная, `404` если бюджет не найден, `409` если категория с таким названием уже существует в этом бюджете.

### Изменить категорию

```http
PATCH /api/categories/:categoryId
Content-Type: application/json
```

Request:

```json
{
	"name": "Продукты и бытовые товары",
	"plannedAmount": "28000.00"
}
```

Response `200 OK`: обновленная категория.

### Удалить категорию

```http
DELETE /api/categories/:categoryId
```

Если у категории есть расходы, API возвращает `409`. Сначала расходы нужно удалить или перенести в другую категорию.

Response: `204 No Content`.

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
	"amount": "9000.00",
	"note": "Обновленная сумма"
}
```

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
