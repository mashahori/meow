import { z } from 'zod';

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const apiBaseUrl = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || '').replace(
  /\/+$/,
  '',
);

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  errorMessage: string,
  init: RequestInit = {},
  networkErrorMessage = 'Unable to connect to the server. Please check that it is available.',
): Promise<T> {
  const response = await request(path, init, errorMessage, networkErrorMessage);
  return schema.parse(await response.json());
}

export async function requestVoid(
  path: string,
  errorMessage: string,
  init: RequestInit = {},
  networkErrorMessage = 'Unable to connect to the server. Please check that it is available.',
): Promise<void> {
  await request(path, init, errorMessage, networkErrorMessage);
}

async function request(
  path: string,
  init: RequestInit,
  errorMessage: string,
  networkErrorMessage: string,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...init,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(networkErrorMessage, 0);
    }
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    let payload: unknown;

    if (body) {
      try {
        payload = JSON.parse(body);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }

    const parsedError = apiErrorSchema.safeParse(payload);
    throw new ApiError(
      parsedError.success
        ? parsedError.data.error.message
        : `${errorMessage} (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    );
  }

  return response;
}
