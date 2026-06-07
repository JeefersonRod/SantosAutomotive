export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface ApiFetchOptions extends RequestInit {
  skipAuthHandling?: boolean;
}

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (status: number, payload: unknown) => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string') return error;
  }

  if (status === 401) return 'Sessão expirada. Faça login novamente.';
  if (status === 403) return 'Seu perfil não tem permissão para acessar esta área.';
  return 'Não foi possível concluir a solicitação.';
};

export const apiFetch = async (url: string, options: ApiFetchOptions = {}) => {
  const { skipAuthHandling, ...fetchOptions } = options;
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
  });

  if (response.ok) {
    return response;
  }

  const payload = await parseJsonSafely(response);
  const message = getErrorMessage(response.status, payload);

  if (!skipAuthHandling && response.status === 401) {
    window.dispatchEvent(new CustomEvent('santos:session-expired'));
  }

  if (!skipAuthHandling && response.status === 403) {
    window.dispatchEvent(new CustomEvent('santos:access-denied', { detail: { message } }));
  }

  throw new ApiError(response.status, message, payload);
};

export const apiRequest = async <T>(url: string, options: ApiFetchOptions = {}) => {
  const response = await apiFetch(url, options);
  const payload = await parseJsonSafely(response);
  return payload as T;
};
