import { Capacitor, CapacitorHttp } from '@capacitor/core';

const TOKEN_KEY = 'rentph_api_token';

export interface ApiUser {
  id: number | string;
  name: string;
  email: string;
  role: 'student' | 'renter' | 'owner' | 'admin';
  account_status: 'active' | 'suspended' | 'pending' | 'banned';
  email_verified_at: string | null;
}

interface AuthResult {
  user: ApiUser;
  token: string;
}

export function resolveApiBaseUrl(configuredUrl: string | undefined, native: boolean): string {
  const configured = configuredUrl?.trim();
  const base = configured || (native ? 'http://10.0.2.2:8000/api/v1' : '/api/v1');
  if (native && !/^https?:\/\//i.test(base)) {
    throw new Error('Android requires an absolute HTTP(S) VITE_API_BASE_URL.');
  }
  return base.replace(/\/+$/, '');
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiBaseUrl = (): string => resolveApiBaseUrl(
  import.meta.env?.VITE_API_BASE_URL,
  Capacitor.isNativePlatform(),
);

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    if (isRecord(payload.errors)) {
      for (const messages of Object.values(payload.errors)) {
        if (Array.isArray(messages)) {
          const message = messages.find(item => typeof item === 'string' && item.length > 0);
          if (typeof message === 'string') return message;
        }
      }
    }
    if (typeof payload.message === 'string' && payload.message) return payload.message;
  }
  return `Request failed (${status}).`;
}

async function request<T>(
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
  includeToken = true,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const token = includeToken ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let status: number;
  let payload: unknown;
  const baseUrl = apiBaseUrl();
  const url = `${baseUrl}${path}`;

  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data: body,
        connectTimeout: 10000,
        readTimeout: 15000,
      });
      status = response.status;
      payload = response.data;
    } else {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      status = response.status;
      const text = await response.text();
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ApiError(`The RentPH API returned a non-JSON response (${status}).`, status);
      }
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Cannot reach the RentPH API at ${baseUrl}. Please try again.`, 0);
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(errorMessage(payload, status), status);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError('The API returned an invalid response.', status);
  }

  return payload.data as T;
}

function validateUser(value: unknown): ApiUser {
  if (!isRecord(value) ||
    (typeof value.id !== 'number' && typeof value.id !== 'string') ||
    typeof value.name !== 'string' || typeof value.email !== 'string' ||
    !['student', 'renter', 'owner', 'admin'].includes(String(value.role)) ||
    !['active', 'suspended', 'pending', 'banned'].includes(String(value.account_status)) ||
    (value.email_verified_at !== null && typeof value.email_verified_at !== 'string')) {
    throw new ApiError('The API returned invalid account data.', 200);
  }
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role as ApiUser['role'],
    account_status: value.account_status as ApiUser['account_status'],
    email_verified_at: value.email_verified_at,
  };
}

function acceptAuthResult(result: unknown): ApiUser {
  if (!isRecord(result) || typeof result.token !== 'string' || !/^[1-9]\d*\|.+$/.test(result.token)) {
    throw new ApiError('The API returned invalid authentication data.', 200);
  }
  const user = validateUser(result.user);
  setToken(result.token);
  return user;
}

export const authApi = {
  getToken,
  clearToken,

  async login(email: string, password: string): Promise<ApiUser> {
    const result = await request<AuthResult>('/auth/login', 'POST', { email, password }, false);
    return acceptAuthResult(result);
  },

  async register(name: string, email: string, password: string, role: 'student' | 'renter' | 'owner'): Promise<ApiUser> {
    const result = await request<AuthResult>('/auth/register', 'POST', {
      name,
      email,
      password,
      password_confirmation: password,
      role,
    }, false);
    return acceptAuthResult(result);
  },

  async me(): Promise<ApiUser> {
    const result = await request<{ user: ApiUser }>('/auth/me');
    return validateUser(isRecord(result) ? result.user : undefined);
  },

  async logout(): Promise<void> {
    try {
      if (getToken()) await request<null>('/auth/logout', 'POST');
    } finally {
      clearToken();
    }
  },
};