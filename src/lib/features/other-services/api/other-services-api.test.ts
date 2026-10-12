import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getOtherServices, 
  getOtherServiceById, 
  createOtherService, 
  lookupHeads 
} from './other-services-api';

describe('Other Services API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getOtherServices queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getOtherServices({ page: 2, paymentStatus: 'pending', processingStatus: 'confirmed' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/other?page=2&paymentStatus=pending&processingStatus=confirmed');
  });

  it('should resolve getOtherServiceById path correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 99 })
    } as Response);

    const data = await getOtherServiceById(99);
    expect(data.id).toBe(99);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/other/99');
  });

  it('should post createOtherService request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 1234 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      name: 'John Doe',
      isInhouse: true,
      amount: 150,
      serviceName: 'Insurance',
      paymentMethod: 'cash',
      status: 'pending'
    };

    const key = 'test-idempotency-key';
    const response = await createOtherService(requestBody, key);
    expect(response.id).toBe(1234);

    const fetchOptions = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchOptions.method).toBe('POST');
    const headers = fetchOptions.headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe(key);
    expect(fetchOptions.body).toBe(JSON.stringify(requestBody));
  });

  it('should format lookupHeads parameters correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([])
    } as Response);

    await lookupHeads('jane', 15);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=jane&limit=15');
  });
});
