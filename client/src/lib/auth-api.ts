import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
})

const authResponseSchema = z.object({ user: userSchema })
const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export type AuthUser = z.infer<typeof userSchema>
export type Credentials = {
  email: string
  password: string
}

export class ApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const apiBaseUrl = (
  import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '')

async function authRequest(path: string, body?: Credentials): Promise<Response> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/api/auth${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError('Не удалось подключиться к серверу. Проверьте его доступность.', 0)
    }
    throw error
  }

  if (!response.ok) {
    const payload: unknown = await response.json()
    const parsedError = apiErrorSchema.safeParse(payload)
    throw new ApiError(
      parsedError.success ? parsedError.data.error.message : `Ошибка запроса (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    )
  }

  return response
}

export async function login(credentials: Credentials): Promise<AuthUser> {
  const response = await authRequest('/login', credentials)
  const payload: unknown = await response.json()
  return authResponseSchema.parse(payload).user
}

export async function register(credentials: Credentials): Promise<void> {
  const response = await authRequest('/register', credentials)
  authResponseSchema.parse(await response.json())
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authRequest('/me')
  const payload: unknown = await response.json()
  return authResponseSchema.parse(payload).user
}

export async function logout(): Promise<void> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError('Не удалось подключиться к серверу. Проверьте его доступность.', 0)
    }
    throw error
  }

  if (!response.ok) {
    const payload: unknown = await response.json()
    const parsedError = apiErrorSchema.safeParse(payload)
    throw new ApiError(
      parsedError.success ? parsedError.data.error.message : `Ошибка запроса (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    )
  }
}
