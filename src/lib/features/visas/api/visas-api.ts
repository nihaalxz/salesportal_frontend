import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type VisaApplicationSummary = components['schemas']['VisaApplicationSummaryResponse'] & { applicantNames?: string | null };
export type VisaApplicationSummaryPagedList = components['schemas']['VisaApplicationSummaryResponsePagedResponse'];
export type VisaApplicationDetail = components['schemas']['VisaApplicationDetailResponse'];
export type CreateVisaRequest = components['schemas']['CreateVisaBookingRequest'];
export type VisaBookingResponse = components['schemas']['VisaBookingResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

/**
 * Fetches a specific visa booking detail record.
 */
export async function getVisaApplicationById(id: number | string, signal?: AbortSignal): Promise<VisaApplicationDetail> {
  return apiFetch<VisaApplicationDetail>(`/api/sales/bookings/visas/${id}`, { signal });
}

export interface VisaQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated visa applications.
 */
export async function getVisaApplications(params: VisaQueryParams, signal?: AbortSignal): Promise<VisaApplicationSummaryPagedList> {
  return apiFetch<VisaApplicationSummaryPagedList>('/api/sales/bookings/visas', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new visa booking application.
 */
export async function createVisaBooking(
  request: CreateVisaRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<VisaBookingResponse> {
  return apiFetch<VisaBookingResponse>('/api/sales/bookings/visas', {
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

export interface VisaCountryMaster {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
  packagesCount: number;
}

export interface VisaPackageMaster {
  id: number;
  countryId: number;
  countryName: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getVisaCountries(signal?: AbortSignal): Promise<VisaCountryMaster[]> {
  return apiFetch<VisaCountryMaster[]>('/api/sales/bookings/visas/countries', { signal });
}

export async function getVisaPackages(countryId?: number, signal?: AbortSignal): Promise<VisaPackageMaster[]> {
  const params: Record<string, any> = {};
  if (countryId) params.countryId = countryId;
  return apiFetch<VisaPackageMaster[]>('/api/sales/bookings/visas/packages', { params, signal });
}

export interface ApplicantDocReuploadPayload {
  applicantId: number;
  passportCopy?: string | null;
  iqamaHotelNo?: string | null;
  bankDoc?: string | null;
}

export async function reuploadVisaDocuments(
  bookingId: number,
  applicants: ApplicantDocReuploadPayload[],
  signal?: AbortSignal
): Promise<void> {
  return apiFetch<void>(`/api/sales/bookings/visas/${bookingId}/reupload-documents`, {
    method: 'POST',
    body: JSON.stringify({ applicants }),
    signal
  });
}
