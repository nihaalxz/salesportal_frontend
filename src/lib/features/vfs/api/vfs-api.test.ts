import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getVfsAppointments,
  createVfsAppointment,
  lookupHeads
} from './vfs-api';

describe('VFS API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getVfsAppointments queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getVfsAppointments({ page: 2, paymentStatus: 'pending', processingStatus: 'success' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/vfs?page=2&paymentStatus=pending&processingStatus=success');
  });

  it('should post createVfsAppointment request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 1001 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      prefix: 'Mr.',
      name: 'John Doe',
      country: 'Germany',
      visaType: 'Tourist',
      amount: 60,
      expectedSupplierCost: 40,
      paymentMethod: 'cash'
    };

    const key = 'vfs-idempotency-key';
    const response = await createVfsAppointment(requestBody, key);
    expect(response.id).toBe(1001);

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

    await lookupHeads('alice', 10);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=alice&limit=10');
  });
});
