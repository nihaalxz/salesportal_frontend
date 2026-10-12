import { apiFetch, type RequestOptions } from '$lib/api/client';
import type {
  CustomerAccountSummaryResponse,
  CustomerApplicationReceivableSummary,
  AccountStatementResponse,
  AccountTimelineItemResponse
} from '../types/customer-account-types';

export async function fetchCustomerAccountSummary(
  headId: number,
  headType: string = 'Customer',
  options?: RequestOptions
): Promise<CustomerAccountSummaryResponse> {
  return apiFetch<CustomerAccountSummaryResponse>(`/api/customer-accounts/${headId}/summary`, {
    ...options,
    params: { headType, ...options?.params }
  });
}

export async function fetchCustomerApplicationsSummary(
  headId: number,
  headType: string = 'Customer',
  options?: RequestOptions
): Promise<CustomerApplicationReceivableSummary> {
  return apiFetch<CustomerApplicationReceivableSummary>(`/api/customer-accounts/${headId}/applications`, {
    ...options,
    params: { headType, ...options?.params }
  });
}

export async function fetchCustomerAccountStatement(
  headId: number,
  options?: RequestOptions
): Promise<AccountStatementResponse> {
  return apiFetch<AccountStatementResponse>(`/api/customer-accounts/${headId}`, options);
}

export async function fetchCustomerAccountTimeline(
  headId: number,
  options?: RequestOptions
): Promise<AccountTimelineItemResponse[]> {
  return apiFetch<AccountTimelineItemResponse[]>(`/api/customer-accounts/${headId}/timeline`, options);
}
