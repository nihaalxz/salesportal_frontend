import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type LeadSummary = components['schemas']['LeadSummaryResponse'];
export type LeadSummaryPagedList = components['schemas']['LeadSummaryResponsePagedResponse'];
export type LeadDetail = components['schemas']['LeadDetailResponse'];

export interface LeadsQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
}

/**
 * Fetches paginated list of leads owned by the salesman.
 */
export async function getLeads(params: LeadsQueryParams, signal?: AbortSignal): Promise<LeadSummaryPagedList> {
  return apiFetch<LeadSummaryPagedList>('/api/sales/leads', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Fetches details for a specific lead.
 */
export async function getLeadById(id: number, signal?: AbortSignal): Promise<LeadDetail> {
  return apiFetch<LeadDetail>(`/api/sales/leads/${id}`, { signal });
}

/**
 * Creates a new sales lead.
 */
export async function createLead(
  request: components['schemas']['CreateLeadRequest']
): Promise<LeadDetail> {
  return apiFetch<LeadDetail>('/api/sales/leads', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

/**
 * Updates an existing sales lead.
 */
export async function updateLead(
  id: number,
  request: components['schemas']['UpdateLeadRequest']
): Promise<LeadDetail> {
  return apiFetch<LeadDetail>(`/api/sales/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  });
}

/**
 * Archives (soft-deletes) a sales lead.
 */
export async function archiveLead(id: number): Promise<void> {
  return apiFetch<void>(`/api/sales/leads/${id}`, {
    method: 'DELETE'
  });
}
