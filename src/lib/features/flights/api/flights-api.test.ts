import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getFlightBookings, 
  createFlightBooking, 
  lookupHeads 
} from './flights-api';

describe('Flights API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getFlightBookings queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getFlightBookings({ page: 2, paymentStatus: 'pending', processingStatus: 'success' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/flights?page=2&paymentStatus=pending&processingStatus=success');
  });

  it('should post createFlightBooking request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 9876 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      fromLocation: 'BAH',
      toLocation: 'DXB',
      paymentMethod: 'cash',
      passengers: [
        { prefix: 'Mr.', passengerName: 'John', expectedSupplierCost: 40, amount: 60, isInhouse: false, supplierId: 1 }
      ]
    };

    const key = 'flight-idempotency-key';
    const response = await createFlightBooking(requestBody, key);
    expect(response.id).toBe(9876);

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

    await lookupHeads('jane', 12);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=jane&limit=12');
  });
});
