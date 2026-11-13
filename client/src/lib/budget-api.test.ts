import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBudget,
  cloneBudget,
  createBudget,
  createCategory,
  deleteBudget,
  deleteCategory,
  getBudgetDetails,
  getBudgets,
  getCategoryGroups,
  unarchiveBudget,
  activateBudget,
  deactivateBudget,
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
  groupSlug: 'food',
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
const categoryPayload = { name: 'Food', plannedAmount: '300', groupSlug: null }

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
          groupSlug: category.groupSlug,
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

  it('archives a budget', async () => {
    const archived = { ...budget, status: 'archived', isActive: false }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(archived)))

    await expect(archiveBudget(budgetId)).resolves.toEqual(archived)
    expect(fetchMock).toHaveBeenCalledWith(`/api/budgets/${budgetId}/archive`, {
      credentials: 'include',
      method: 'POST',
    })
  })

  it('restores a budget from the archive', async () => {
    const restored = { ...budget, status: 'active' }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(restored)))

    await expect(unarchiveBudget(budgetId)).resolves.toEqual(restored)
    expect(fetchMock).toHaveBeenCalledWith(`/api/budgets/${budgetId}/unarchive`, {
      credentials: 'include',
      method: 'POST',
    })
  })

  it('clones a budget', async () => {
    const cloned = { ...budget, id: '0b7f3c52-3d6e-4f0a-9d1e-8a2b6c4e7f10', name: 'Household (копия)' }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(cloned), { status: 201 }))

    await expect(cloneBudget(budgetId)).resolves.toEqual(cloned)
    expect(fetchMock).toHaveBeenCalledWith(`/api/budgets/${budgetId}/clone`, {
      credentials: 'include',
      method: 'POST',
    })
  })

  it('makes a budget active and inactive', async () => {
    const inactive = { ...budget, isActive: false }
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(budget)))
      .mockResolvedValueOnce(new Response(JSON.stringify(inactive)))

    await expect(activateBudget(budgetId)).resolves.toEqual(budget)
    await expect(deactivateBudget(budgetId)).resolves.toEqual(inactive)
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`/api/budgets/${budgetId}/activate`, 'POST'],
      [`/api/budgets/${budgetId}/deactivate`, 'POST'],
    ])
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

  it('loads category groups', async () => {
    const groups = [
      { slug: 'food', sortOrder: 10 },
      { slug: 'eating-out', sortOrder: 20 },
    ]
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ items: groups })))

    await expect(getCategoryGroups()).resolves.toEqual(groups)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/category-groups')
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
