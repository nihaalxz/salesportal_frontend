import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLeads, getLeadById, createLead, updateLead, archiveLead } from './leads-api';

describe('Leads API Module', () => {
  const globalFetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', globalFetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should format getLeads query parameters correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], totalCount: 0 })
    } as Response);

    await getLeads({ page: 1, searchTerm: 'Alice', status: 'Pending' });

    expect(globalFetchMock).toHaveBeenCalledOnce();
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/leads?page=1&searchTerm=Alice&status=Pending');
  });

  it('should format getLeadById path correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 50, name: 'John' })
    } as Response);

    const data = await getLeadById(50);
    expect(data.id).toBe(50);
    
    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sales/leads/50');
  });

  it('should format createLead request correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 101, name: 'Jane' })
    } as Response);

    const payload = {
      name: 'Jane Connor',
      countryCode: '+973',
      mobileNo: '33334444',
      services: ['Flights'],
      leadSource: 'WhatsApp',
      description: 'Test lead',
      reminderDate: '2026-07-20T12:00:00Z'
    };

    const res = await createLead(payload);
    expect(res.id).toBe(101);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    const options = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(calledUrl).toContain('/api/sales/leads');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  it('should format updateLead request correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 50, name: 'Jane Updated' })
    } as Response);

    const payload = {
      name: 'Jane Connor Updated',
      status: 'Followed Up',
      countryCode: '+973',
      mobileNo: '33334444',
      services: ['Flights', 'Hotel Booking'],
      leadSource: 'WhatsApp',
      description: 'Follow-up info',
      reminderDate: null
    };

    const res = await updateLead(50, payload);
    expect(res.id).toBe(50);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    const options = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(calledUrl).toContain('/api/sales/leads/50');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  it('should format archiveLead DELETE request correctly', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => ({})
    } as Response);

    await archiveLead(50);

    const calledUrl = globalFetchMock.mock.calls[0][0] as string;
    const options = globalFetchMock.mock.calls[0][1] as RequestInit;
    expect(calledUrl).toContain('/api/sales/leads/50');
    expect(options.method).toBe('DELETE');
  });
});
