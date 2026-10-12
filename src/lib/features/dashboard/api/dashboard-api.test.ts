import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDashboardSummary } from './dashboard-api';

describe('Dashboard API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should query the backend dashboard summary endpoint', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ totalFlightBookings: 10 })
    } as Response);

    const data = await getDashboardSummary();
    expect(data.totalFlightBookings).toBe(10);
    expect(globalFetchMock).toHaveBeenCalledOnce();
    
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/dashboard/summary');
  });
});
