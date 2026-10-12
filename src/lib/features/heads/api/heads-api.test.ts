import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHeads, getHeadById, getHeadLedger, createHead } from './heads-api';

describe('Heads API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getHeads query arguments correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getHeads({ page: 2, searchTerm: 'john', sortBy: 'wallet' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads?page=2&searchTerm=john&sortBy=wallet');
  });

  it('should resolve getHeadById path parameter', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 45 })
    } as Response);

    const data = await getHeadById(45);
    expect(data.id).toBe(45);
    
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/45');
  });

  it('should format getHeadLedger path and query params', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [] })
    } as Response);

    await getHeadLedger(12, { page: 3, pageSize: 50 });

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/heads/12/ledger?page=3&pageSize=50');
  });

  it('should format createHead POST request correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 99, firstName: 'John' })
    } as Response);

    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      type: 'customer',
      mobileNo: '12345678',
      email: 'john@example.com',
      nationality: 'Bahraini',
      address: 'Manama'
    };

    const res = await createHead(payload);
    expect(res.id).toBe(99);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    const options = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(calledUrl).toContain('/api/sales/heads');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });
});
