import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getVisaApplications, 
  createVisaBooking, 
  lookupHeads 
} from './visas-api';

describe('Visas API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getVisaApplications queries correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getVisaApplications({ page: 2, paymentStatus: 'pending', processingStatus: 'success' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/bookings/visas?page=2&paymentStatus=pending&processingStatus=success');
  });

  it('should post createVisaBooking request and forward idempotency header', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 5432 })
    } as Response);

    const requestBody = {
      clientType: 'customer',
      headId: 1,
      countryId: 1,
      visaPackId: 10,
      visaPackName: 'Tourist Visa',
      paymentMethod: 'cash',
      supplierId: 2,
      applicants: [
        { prefix: 'Mr.', fName: 'FName', lName: 'LName', nationality: 'Bahraini', contactNo: '12345', emailId: 't@t.com', passportNo: 'P123', amount: 60, expectedSupplierCost: 40, isInhouse: false }
      ]
    };

    const key = 'visa-idempotency-key';
    const response = await createVisaBooking(requestBody, key);
    expect(response.id).toBe(5432);

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

    await lookupHeads('jake', 15);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/lookup?search=jake&limit=15');
  });
});
