import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getReceipts, getReceiptById, createReceipt, getBookingOptions } from './receipts-api';

describe('Receipts API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getReceipts query parameters correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getReceipts({ page: 1, searchTerm: 'INV1023' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/receipts?page=1&searchTerm=INV1023');
  });

  it('should format getReceiptById path correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 10, receiptId: 'INV1001' })
    } as Response);

    const data = await getReceiptById(10);
    expect(data.id).toBe(10);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/receipts/10');
  });

  it('should format createReceipt request correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 12, receiptId: 'INV1012' })
    } as Response);

    const payload = {
      headId: 44,
      clientType: 'customer',
      agentName: null,
      narration: 'Hotel reservation payment',
      service: 'hotels',
      bookingId: 104,
      amount: 150.000,
      paymentMode: 'wallet',
      bankId: null,
      bankName: null
    };

    const res = await createReceipt(payload);
    expect(res.id).toBe(12);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    const options = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(calledUrl).toContain('/api/sales/receipts');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });


  it('should format getBookingOptions query parameters correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => []
    } as Response);

    await getBookingOptions(44, 'flights');

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/receipts/booking-options?headId=44&service=flights');
  });
});
