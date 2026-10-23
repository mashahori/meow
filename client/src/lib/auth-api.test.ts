import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentUser,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
} from './auth-api'

const fetchMock = vi.fn()
const user = { id: 'user-1', email: 'person@example.com' }

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('authentication API', () => {
  it('logs in with credentials and returns the user', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ user })))

    await expect(login({ email: user.email, password: 'secret' })).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'secret' }),
    })
  })

  it('registers and submits password reset requests', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ user })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(register({ email: user.email, password: 'secret' })).resolves.toBeUndefined()
    await expect(requestPasswordReset(user.email)).resolves.toBeUndefined()
    await expect(resetPassword('reset-token', 'new-secret')).resolves.toBeUndefined()

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      ['/api/auth/register', 'POST', JSON.stringify({ email: user.email, password: 'secret' })],
      ['/api/auth/forgot-password', 'POST', JSON.stringify({ email: user.email })],
      ['/api/auth/reset-password', 'POST', JSON.stringify({ token: 'reset-token', password: 'new-secret' })],
    ])
  })

  it('loads the current user with the supplied abort signal', async () => {
    const controller = new AbortController()
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ user })))

    await expect(getCurrentUser(controller.signal)).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      credentials: 'include',
      signal: controller.signal,
    })
  })

  it('logs out with a POST request', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(logout()).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      credentials: 'include',
      method: 'POST',
    })
  })
})
