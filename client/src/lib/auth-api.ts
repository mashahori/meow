import { z } from 'zod';
import { requestJson, requestVoid } from './api-client';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const authResponseSchema = z.object({ user: userSchema });

export type AuthUser = z.infer<typeof userSchema>;
export type Credentials = {
  email: string;
  password: string;
};

export { ApiError } from './api-client';

const authNetworkError = 'Не удалось подключиться к серверу. Проверьте его доступность.';

function postJson(body: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function login(credentials: Credentials): Promise<AuthUser> {
  const response = await requestJson(
    '/api/auth/login',
    authResponseSchema,
    'Ошибка запроса',
    postJson(credentials),
    authNetworkError,
  );
  return response.user;
}

export async function register(credentials: Credentials): Promise<void> {
  await requestJson(
    '/api/auth/register',
    authResponseSchema,
    'Ошибка запроса',
    postJson(credentials),
    authNetworkError,
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  await requestVoid(
    '/api/auth/forgot-password',
    'Ошибка запроса',
    postJson({ email }),
    authNetworkError,
  );
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await requestVoid(
    '/api/auth/reset-password',
    'Ошибка запроса',
    postJson({ token, password }),
    authNetworkError,
  );
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const response = await requestJson(
    '/api/auth/me',
    authResponseSchema,
    'Ошибка запроса',
    { signal },
    authNetworkError,
  );
  return response.user;
}

export async function logout(): Promise<void> {
  await requestVoid('/api/auth/logout', 'Ошибка запроса', { method: 'POST' }, authNetworkError);
}
