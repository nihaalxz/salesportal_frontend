import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTransportations,
  createTransportation,
  lookupHeads
} from './transport-api';

describe('Transport API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getTransportations queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getTransportations({ page: 3, processingStatus: 'pending' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/transport?page=3&processingStatus=pending');
  });

  it('should post createTransportation request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 3001 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      prefix: 'Mr.',
      name: 'John Doe',
      pickup: 'Airport',
      drop: 'Hotel',
      amount: 60,
      expectedSupplierCost: 40,
      paymentMethod: 'cash'
    };

    const key = 'transport-idempotency-key';
    const response = await createTransportation(requestBody, key);
    expect(response.id).toBe(3001);

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

    await lookupHeads('charlie', 8);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=charlie&limit=8');
  });
});
