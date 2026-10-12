import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type FlightBookingSummary = components['schemas']['FlightBookingSummaryResponse'] & { passengerNames?: string | null };
export type FlightBookingSummaryPagedList = components['schemas']['FlightBookingSummaryResponsePagedResponse'];
export type FlightBookingDetail = components['schemas']['FlightBookingDetailResponse'];
export type CreateFlightRequest = components['schemas']['CreateFlightBookingRequest'];
export type FlightBookingResponse = components['schemas']['FlightBookingResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

/**
 * Fetches a specific flight booking detail record.
 */
export async function getFlightBookingById(id: number | string, signal?: AbortSignal): Promise<FlightBookingDetail> {
  return apiFetch<FlightBookingDetail>(`/api/sales/bookings/flights/${id}`, { signal });
}

export interface FlightQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated flight bookings.
 */
export async function getFlightBookings(params: FlightQueryParams, signal?: AbortSignal): Promise<FlightBookingSummaryPagedList> {
  return apiFetch<FlightBookingSummaryPagedList>('/api/sales/bookings/flights', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new flight booking with passenger records, idempotency, and financial checks.
 */
export async function createFlightBooking(
  request: CreateFlightRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<FlightBookingResponse> {
  return apiFetch<FlightBookingResponse>('/api/sales/bookings/flights', {
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
