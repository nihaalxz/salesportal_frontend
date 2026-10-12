import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type HeadSummary = components['schemas']['HeadSummaryResponse'];
export type HeadSummaryPagedList = components['schemas']['HeadSummaryResponsePagedResponse'];
export type HeadDetail = components['schemas']['HeadDetailResponse'];
export type HeadLedgerEntryPagedList = components['schemas']['HeadLedgerEntryResponsePagedResponse'];

export interface HeadsQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  type?: string;
}

export interface HeadLedgerQueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  serviceType?: string;
  search?: string;
  sort?: 'asc' | 'desc' | string;
}

/**
 * Fetches the paginated and sorted list of customer Heads.
 */
export async function getHeads(params: HeadsQueryParams, signal?: AbortSignal): Promise<HeadSummaryPagedList> {
  return apiFetch<HeadSummaryPagedList>('/api/sales/heads', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Fetches detail profile records for a specific Head.
 */
export async function getHeadById(id: number, type?: string, signal?: AbortSignal): Promise<HeadDetail> {
  return apiFetch<HeadDetail>(`/api/sales/heads/${id}`, { params: { type }, signal });
}

/**
 * Fetches chronological transaction ledger listings for a specific Head.
 */
export async function getHeadLedger(
  id: number,
  params: HeadLedgerQueryParams,
  signal?: AbortSignal
): Promise<HeadLedgerEntryPagedList> {
  return apiFetch<HeadLedgerEntryPagedList>(`/api/sales/heads/${id}/ledger`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new customer head record.
 */
export async function createHead(
  request: components['schemas']['CreateHeadRequest']
): Promise<HeadDetail> {
  return apiFetch<HeadDetail>('/api/sales/heads', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

/**
 * Gets outstanding bookings for a head.
 */
export async function getOutstandingBookings(
  id: number,
  type?: string,
  signal?: AbortSignal
): Promise<components['schemas']['OutstandingBookingResponse'][]> {
  return apiFetch<components['schemas']['OutstandingBookingResponse'][]>(`/api/sales/heads/${id}/bookings/outstanding`, {
    params: { type },
    signal
  });
}

/**
 * Looks up active heads by search term. Pass type='agent' for agency accounts, type='customer' (default) for direct customers.
 */
export async function lookupHeads(
  search?: string,
  limit?: number,
  type?: string,
  signal?: AbortSignal
): Promise<components['schemas']['HeadLookupResponse'][]> {
  return apiFetch<components['schemas']['HeadLookupResponse'][]>('/api/sales/heads/lookup', {
    params: { search, limit, type },
    signal
  });
}
