import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getHotelBookings, 
  createHotelBooking, 
  lookupHeads 
} from './hotels-api';

describe('Hotels API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getHotelBookings queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getHotelBookings({ page: 3, paymentStatus: 'paid', processingStatus: 'confirmed' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/hotels?page=3&paymentStatus=paid&processingStatus=confirmed');
  });

  it('should post createHotelBooking request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 5678 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      prefix: 'Mr.',
      guestName: 'Bob Hotel',
      country: 'Bahrain',
      days: 3,
      checkInDate: new Date('2026-07-20').toISOString(),
      isInhouse: true,
      amount: 150,
      paymentMethod: 'cash',
      status: 'pending'
    };

    const key = 'hotel-idempotency-key';
    const response = await createHotelBooking(requestBody, key);
    expect(response.id).toBe(5678);

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
