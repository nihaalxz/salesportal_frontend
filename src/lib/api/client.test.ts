import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './client';
import { NetworkError, AuthenticationError } from './problem-details';

describe('API Client', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should serialize query parameters correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true })
    } as Response);

    await apiFetch('/test-route', {
      baseUrl: 'http://localhost:8000',
      params: {
        page: 2,
        search: 'john',
        emptyVal: null,
        undefinedVal: undefined
      }
    });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toBe('http://localhost:8000/test-route?page=2&search=john');
  });

  it('should automatically inject headers, including X-Correlation-ID', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    } as Response);

    await apiFetch('/api/sales/heads', {
      baseUrl: 'http://localhost:8000',
      token: 'jwt-mock-token'
    });

    const initOptions = globalFetchMock.mock.calls[0][1] as RequestInit;
    const headers = initOptions.headers as Headers;
    
    expect(headers.get('Authorization')).toBe('Bearer jwt-mock-token');
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.has('X-Correlation-ID')).toBe(true);
  });

  it('should handle 204 No Content responses by returning null', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204
    } as Response);

    const result = await apiFetch('/delete-route', { baseUrl: 'http://localhost:8000' });
    expect(result).toBeNull();
  });

  it('should parse and throw ProblemDetails on non-ok statuses', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ title: 'Unauthorized', detail: 'Token has expired' })
    } as Response);

    await expect(
      apiFetch('/secure-route', { baseUrl: 'http://localhost:8000' })
    ).rejects.toThrow(AuthenticationError);
  });

  it('should throw NetworkError on connection failure', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    await expect(
      apiFetch('/network-fail', { baseUrl: 'http://localhost:8000' })
    ).rejects.toThrow(NetworkError);
  });
});
