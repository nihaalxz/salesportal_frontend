import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type HolidayPackageSummary = components['schemas']['HolidayPackageSummaryResponse'];
export type HolidayPackageSummaryPagedList = components['schemas']['HolidayPackageSummaryResponsePagedResponse'];
export type HolidayPackageDetail = components['schemas']['HolidayPackageDetailResponse'];
export type CreateHolidayPackageRequest = components['schemas']['CreateHolidayPackageRequest'];
export type HolidayPackageResponse = components['schemas']['HolidayPackageResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

/**
 * Fetches a specific holiday package booking detail record.
 */
export async function getHolidayPackageById(id: number | string, signal?: AbortSignal): Promise<HolidayPackageDetail> {
  return apiFetch<HolidayPackageDetail>(`/api/sales/bookings/holidays/${id}`, { signal });
}

export interface HolidayQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated holiday package bookings.
 */
export async function getHolidayPackages(params: HolidayQueryParams, signal?: AbortSignal): Promise<HolidayPackageSummaryPagedList> {
  return apiFetch<HolidayPackageSummaryPagedList>('/api/sales/bookings/holidays', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new holiday package booking.
 */
export async function createHolidayPackage(
  request: CreateHolidayPackageRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<HolidayPackageResponse> {
  return apiFetch<HolidayPackageResponse>('/api/sales/bookings/holidays', {
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
