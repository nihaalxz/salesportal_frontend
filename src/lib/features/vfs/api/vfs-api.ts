import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type VfsAppointmentSummary = components['schemas']['VfsAppointmentSummaryResponse'];
export type VfsAppointmentSummaryPagedList = components['schemas']['VfsAppointmentSummaryResponsePagedResponse'];
export type VfsAppointmentDetail = components['schemas']['VfsAppointmentDetailResponse'];
export type CreateVfsAppointmentRequest = components['schemas']['CreateVfsAppointmentRequest'];
export type VfsAppointmentResponse = components['schemas']['VfsAppointmentResponse'];
export type HeadLookup = components['schemas']['HeadLookupResponse'];

/**
 * Fetches a specific VFS appointment booking detail record.
 */
export async function getVfsAppointmentById(id: number | string, signal?: AbortSignal): Promise<VfsAppointmentDetail> {
  return apiFetch<VfsAppointmentDetail>(`/api/sales/bookings/vfs/${id}`, { signal });
}

export interface VfsQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated VFS appointment bookings.
 */
export async function getVfsAppointments(params: VfsQueryParams, signal?: AbortSignal): Promise<VfsAppointmentSummaryPagedList> {
  return apiFetch<VfsAppointmentSummaryPagedList>('/api/sales/bookings/vfs', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new VFS appointment booking.
 */
export async function createVfsAppointment(
  request: CreateVfsAppointmentRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<VfsAppointmentResponse> {
  return apiFetch<VfsAppointmentResponse>('/api/sales/bookings/vfs', {
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
