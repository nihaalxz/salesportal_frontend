import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHolidayPackages,
  createHolidayPackage,
  lookupHeads
} from './holidays-api';

describe('Holidays API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getHolidayPackages queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getHolidayPackages({ page: 1, paymentStatus: 'pending' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/holidays?page=1&paymentStatus=pending');
  });

  it('should post createHolidayPackage request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 2001 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      prefix: 'Mr.',
      passengerName: 'Jane Doe',
      country: 'Georgia',
      days: 5,
      amount: 60,
      expectedSupplierCost: 40,
      paymentMethod: 'cash'
    };

    const key = 'holiday-idempotency-key';
    const response = await createHolidayPackage(requestBody, key);
    expect(response.id).toBe(2001);

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

    await lookupHeads('bob', 5);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=bob&limit=5');
  });
});
