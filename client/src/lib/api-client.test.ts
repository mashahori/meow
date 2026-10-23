import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, requestJson, requestVoid } from './api-client'

const responseSchema = z.object({ value: z.string() })

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('requestJson', () => {
  it('sends credentials and validates the JSON response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ value: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(requestJson('/api/example', responseSchema, 'Request failed')).resolves.toEqual({
      value: 'ok',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/example', { credentials: 'include' })
  })

  it('uses a structured API error response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Missing' } }), {
        status: 404,
      }),
    )

    await expect(requestJson('/api/example', responseSchema, 'Request failed')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Missing',
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it('falls back to the request message when the error body is invalid', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 502 }))

    await expect(requestJson('/api/example', responseSchema, 'Request failed')).rejects.toMatchObject({
      message: 'Request failed (502).',
      status: 502,
      code: undefined,
    })
  })

  it('converts network errors to ApiError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(requestJson('/api/example', responseSchema, 'Request failed', {}, 'Offline')).rejects
      .toMatchObject({
        name: 'ApiError',
        message: 'Offline',
        status: 0,
      })
  })

  it('surfaces invalid successful response data', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ value: 42 })))

    await expect(requestJson('/api/example', responseSchema, 'Request failed')).rejects.toMatchObject({
      name: 'ZodError',
    })
  })
})

describe('requestVoid', () => {
  it('sends the supplied request options and accepts an empty response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(
      requestVoid('/api/example', 'Request failed', { method: 'DELETE' }),
    ).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/example', {
      credentials: 'include',
      method: 'DELETE',
    })
  })

  it('preserves non-network exceptions', async () => {
    const error = new Error('Unexpected')
    fetchMock.mockRejectedValueOnce(error)

    await expect(requestVoid('/api/example', 'Request failed')).rejects.toBe(error)
  })
})

it('creates ApiError with its public properties', () => {
  const error = new ApiError('Denied', 403, 'FORBIDDEN')

  expect(error).toMatchObject({
    name: 'ApiError',
    message: 'Denied',
    status: 403,
    code: 'FORBIDDEN',
  })
})
