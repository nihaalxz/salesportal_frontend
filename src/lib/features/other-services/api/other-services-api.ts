import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type OtherServiceSummary = components['schemas']['OtherServiceSummaryResponse'];
export type OtherServiceSummaryPagedList = components['schemas']['OtherServiceSummaryResponsePagedResponse'];
export type OtherServiceDetail = components['schemas']['OtherServiceDetailResponse'];
export type CreateOtherServiceRequest = components['schemas']['CreateOtherServiceBookingRequest'];
export type OtherServiceBookingResponse = components['schemas']['OtherServiceBookingResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

export interface OtherServicesQueryParams {
  isDealClosed?: boolean | string;
  dealStatus?: string;
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
}

/**
 * Fetches the paginated other services bookings.
 */
export async function getOtherServices(params: OtherServicesQueryParams, signal?: AbortSignal): Promise<OtherServiceSummaryPagedList> {
  return apiFetch<OtherServiceSummaryPagedList>('/api/sales/bookings/other', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Fetches a specific other service booking detail record.
 */
export async function getOtherServiceById(id: number | string, signal?: AbortSignal): Promise<OtherServiceDetail> {
  return apiFetch<OtherServiceDetail>(`/api/sales/bookings/other/${id}`, { signal });
}

/**
 * Creates a new other service booking with idempotency.
 */
export async function createOtherService(
  request: CreateOtherServiceRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<OtherServiceBookingResponse> {
  return apiFetch<OtherServiceBookingResponse>('/api/sales/bookings/other', {
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
