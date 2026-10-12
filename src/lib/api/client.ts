import { PUBLIC_BACKEND_API_URL } from '$env/static/public';
import { parseProblemDetails, NetworkError, ApiError } from './problem-details';
import { getStoredToken } from '$lib/auth/session';

// Backend API base URL — read from PUBLIC_BACKEND_API_URL env var (see .env).
export const DEFAULT_BASE_URL = PUBLIC_BACKEND_API_URL || 'http://localhost:5190';

export interface RequestOptions extends RequestInit {
  baseUrl?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  token?: string;
}

/**
 * Standardized API client fetch wrapper.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { baseUrl = DEFAULT_BASE_URL, params, token, headers, ...rest } = options;

  // 1. Build URL with query parameters
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  // 2. Prepare headers
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }
  if (!requestHeaders.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Attach Authorization header from stored JWT token (or explicit override)
  const activeToken = token ?? getStoredToken();
  if (activeToken) {
    requestHeaders.set('Authorization', `Bearer ${activeToken}`);
  }

  // Generate a client-side trace/correlation ID
  const traceId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  requestHeaders.set('X-Correlation-ID', traceId);

  // 3. Execute request
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: requestHeaders,
      ...rest
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err; // Re-throw AbortSignal cancellations
    }
    throw new NetworkError();
  }

  // 4. Handle response states
  if (response.status === 204) {
    return null as any;
  }

  // Inspect content type
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorBody: any = null;
    if (isJson) {
      try {
        errorBody = await response.json();
      } catch {
        // Failed to parse error JSON
      }
    }
    throw parseProblemDetails(response.status, errorBody);
  }

  if (isJson) {
    return response.json() as Promise<T>;
  }

  return response.text() as any as Promise<T>;
}

export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  const baseUrl = DEFAULT_BASE_URL.endsWith('/') ? DEFAULT_BASE_URL.slice(0, -1) : DEFAULT_BASE_URL;
  const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${baseUrl}${path}`;
}

export function getFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  const baseUrl = DEFAULT_BASE_URL.endsWith('/') ? DEFAULT_BASE_URL.slice(0, -1) : DEFAULT_BASE_URL;
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${baseUrl}${path}`;
}

export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { baseUrl = DEFAULT_BASE_URL, params, token, headers, ...rest } = options;
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }
  const requestHeaders = new Headers(headers);
  const activeToken = token ?? getStoredToken();
  if (activeToken) {
    requestHeaders.set('Authorization', `Bearer ${activeToken}`);
  }
  const response = await fetch(url.toString(), {
    headers: requestHeaders,
    ...rest
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch binary asset: ${response.statusText}`);
  }
  return response.blob();
}

