import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createExpense,
  deleteExpense,
  getCategoryExpenses,
  updateExpense,
} from './expense-api'

const fetchMock = vi.fn()
const budgetId = '60f37f0f-a553-459a-8519-7edcf74b9860'
const categoryId = '895b6ea8-b461-47c3-afd7-82f23b47d86d'
const expenseId = '159a9d76-3d26-4261-bdd1-563918d72cb7'
const expense = {
  id: expenseId,
  budgetId,
  categoryId,
  amount: '25.50',
  spentAt: '2026-05-10',
  note: 'Lunch',
}
const createPayload = { categoryId, amount: '25.50', spentAt: '2026-05-10', note: 'Lunch' }
const updatePayload = { amount: '30', spentAt: '2026-05-11', note: null }

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('expense API', () => {
  it('loads category expenses with an optional abort signal', async () => {
    const controller = new AbortController()
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ items: [expense] })))

    await expect(getCategoryExpenses(categoryId, controller.signal)).resolves.toEqual([expense])
    expect(fetchMock).toHaveBeenCalledWith(`/api/categories/${categoryId}/expenses`, {
      credentials: 'include',
      signal: controller.signal,
    })
  })

  it('creates an expense with the supplied budget and payload', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(expense)))

    await expect(createExpense(budgetId, createPayload)).resolves.toEqual(expense)
    expect(fetchMock).toHaveBeenCalledWith(`/api/budgets/${budgetId}/expenses`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload),
    })
  })

  it('updates an expense with PATCH', async () => {
    const updatedExpense = { ...expense, ...updatePayload }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(updatedExpense)))

    await expect(updateExpense(expenseId, updatePayload)).resolves.toEqual(updatedExpense)
    expect(fetchMock).toHaveBeenCalledWith(`/api/expenses/${expenseId}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    })
  })

  it('deletes an expense', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(deleteExpense(expenseId)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`/api/expenses/${expenseId}`, {
      credentials: 'include',
      method: 'DELETE',
    })
  })
})
