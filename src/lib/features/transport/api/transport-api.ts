import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type TransportationSummary = components['schemas']['TransportationSummaryResponse'];
export type TransportationSummaryPagedList = components['schemas']['TransportationSummaryResponsePagedResponse'];
export type TransportationDetail = components['schemas']['TransportationDetailResponse'];
export type CreateTransportationRequest = components['schemas']['CreateTransportationRequest'];
export type TransportationResponse = components['schemas']['TransportationResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

/**
 * Fetches a specific transportation booking detail record.
 */
export async function getTransportationById(id: number | string, signal?: AbortSignal): Promise<TransportationDetail> {
  return apiFetch<TransportationDetail>(`/api/sales/bookings/transport/${id}`, { signal });
}

export interface TransportQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated transportation bookings.
 */
export async function getTransportations(params: TransportQueryParams, signal?: AbortSignal): Promise<TransportationSummaryPagedList> {
  return apiFetch<TransportationSummaryPagedList>('/api/sales/bookings/transport', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new transportation booking.
 */
export async function createTransportation(
  request: CreateTransportationRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<TransportationResponse> {
  return apiFetch<TransportationResponse>('/api/sales/bookings/transportations', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify(request),
    signal
  });
}

/**
 * Looks up active customer heads by search query for selection dropdowns.
 */
export async function lookupHeads(search?: string, limit = 20, signal?: AbortSignal): Promise<HeadLookup[]> {
  return apiFetch<HeadLookup[]>('/api/sales/heads/lookup', {
    params: { search, limit },
    signal
  });
}
