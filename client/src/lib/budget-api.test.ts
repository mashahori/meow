import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBudget,
  createCategory,
  deleteBudget,
  deleteCategory,
  getBudgetDetails,
  getBudgets,
  updateBudget,
  updateCategory,
} from './budget-api'

const fetchMock = vi.fn()
const budgetId = '60f37f0f-a553-459a-8519-7edcf74b9860'
const categoryId = '895b6ea8-b461-47c3-afd7-82f23b47d86d'
const budget = {
  id: budgetId,
  name: 'Household',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  status: 'active',
  initialAmount: '1000',
  currency: 'RUB',
  plannedAmount: '900',
  spentAmount: '200',
  remainingAmount: '800',
  isActive: true,
}
const category = {
  id: categoryId,
  budgetId,
  name: 'Food',
  plannedAmount: '300',
  spentAmount: '50',
  remainingAmount: '250',
}
const budgetPayload = {
  name: 'Household',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  initialAmount: 1000,
  currency: 'RUB' as const,
}
const categoryPayload = { name: 'Food', plannedAmount: '300' }

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('budget API', () => {
  it('loads budgets and budget details', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [budget] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...budget, categories: [category] })))

    await expect(getBudgets()).resolves.toEqual([budget])
    await expect(getBudgetDetails(budgetId)).resolves.toEqual({
      ...budget,
      categories: [
        {
          id: category.id,
          name: category.name,
          plannedAmount: category.plannedAmount,
          spentAmount: category.spentAmount,
        },
      ],
    })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/budgets',
      `/api/budgets/${budgetId}`,
    ])
  })

  it('creates and updates budgets with the expected methods and payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(budget)))
      .mockResolvedValueOnce(new Response(JSON.stringify(budget)))

    await expect(createBudget(budgetPayload)).resolves.toEqual(budget)
    await expect(updateBudget(budgetId, budgetPayload)).resolves.toEqual(budget)
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      ['/api/budgets', 'POST', JSON.stringify(budgetPayload)],
      [`/api/budgets/${budgetId}`, 'PATCH', JSON.stringify(budgetPayload)],
    ])
  })

  it('deletes a budget', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(deleteBudget(budgetId)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`/api/budgets/${budgetId}`, {
      credentials: 'include',
      method: 'DELETE',
    })
  })

  it('creates and updates categories with the expected routes', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(category)))
      .mockResolvedValueOnce(new Response(JSON.stringify(category)))

    await expect(createCategory(budgetId, categoryPayload)).resolves.toEqual(category)
    await expect(updateCategory(categoryId, categoryPayload)).resolves.toEqual(category)
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      [`/api/budgets/${budgetId}/categories`, 'POST', JSON.stringify(categoryPayload)],
      [`/api/categories/${categoryId}`, 'PATCH', JSON.stringify(categoryPayload)],
    ])
  })

  it('deletes a category', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(deleteCategory(categoryId)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
      credentials: 'include',
      method: 'DELETE',
    })
  })
})
