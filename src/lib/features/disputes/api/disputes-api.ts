import { apiFetch } from '$lib/api/client';

// ─── Types mirroring the backend DisputeContracts ────────────────────────────

export interface Dispute {
  id: number;
  userId: number;
  headId: number | null;
  headName: string | null;
  disputableId: number;
  disputableType: string;
  subject: string;
  description: string;
  status: string; // 'open' | 'resolved' | 'rejected'
  resolution: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  isRefund: boolean;
  refundAmount: number | null;
  approvedRefundAmount: number | null;
  refundProcessed: boolean;
  refundStatus: string | null;
  refundDate: string | null;
  createdAt: string | null;
  name?: string | null;
  iban?: string | null;
}

export interface DisputesPagedResponse {
  items: Dispute[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DisputesQueryParams {
  page?: number;
  pageSize?: number;
  status?: string | null;
  searchTerm?: string | null;
}

export interface CreateDisputeRequest {
  headId?: number | null;
  disputableId: number;
  disputableType: string;
  subject: string;
  description: string;
  isRefund: boolean;
  refundAmount?: number | null;
  name?: string | null;
  iban?: string | null;
}

export interface ResolveDisputeRequest {
  action: string; // 'accepted' | 'rejected'
  resolution?: string | null;
  resolvedBy?: string | null;
  approvedRefundAmount?: number | null;
}

/**
 * Fetches paginated disputes for the authenticated salesman.
 */
export async function getDisputes(
  params: DisputesQueryParams = {},
  signal?: AbortSignal
): Promise<DisputesPagedResponse> {
  return apiFetch<DisputesPagedResponse>('/api/sales/disputes', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Fetches a single dispute by ID.
 */
export async function getDisputeById(id: number, signal?: AbortSignal): Promise<Dispute> {
  return apiFetch<Dispute>(`/api/sales/disputes/${id}`, { signal });
}

/**
 * Creates a new dispute case.
 */
export async function createDispute(request: CreateDisputeRequest): Promise<Dispute> {
  return apiFetch<Dispute>('/api/sales/disputes', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export interface DisputeBookingOption {
  id: number;
  label: string;
  headId: number | null;
  headName: string | null;
  amount: number;
}

/**
 * Fetches eligible booking options for dispute creation based on service type.
 */
export async function getDisputeBookingOptions(
  serviceType: string,
  signal?: AbortSignal
): Promise<DisputeBookingOption[]> {
  return apiFetch<DisputeBookingOption[]>('/api/sales/disputes/booking-options', {
    params: { serviceType },
    signal
  });
}
