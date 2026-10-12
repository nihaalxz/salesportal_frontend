import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type ReceiptSummary = components['schemas']['ReceiptSummaryResponse'];
export type ReceiptSummaryPagedList = components['schemas']['ReceiptSummaryResponsePagedResponse'];
export type ReceiptDetail = components['schemas']['ReceiptDetailResponse'];
export type BookingOption = components['schemas']['BookingOptionResponse'];

export interface ReceiptsQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

/**
 * Fetches paginated list of receipts owned by the salesman.
 */
export async function getReceipts(params: ReceiptsQueryParams, signal?: AbortSignal): Promise<ReceiptSummaryPagedList> {
  return apiFetch<ReceiptSummaryPagedList>('/api/sales/receipts', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Fetches details for a specific receipt.
 */
export async function getReceiptById(id: number | string, signal?: AbortSignal): Promise<ReceiptDetail> {
  return apiFetch<ReceiptDetail>(`/api/sales/receipts/${id}`, { signal });
}

/**
 * Creates a new payment receipt.
 */
export async function createReceipt(
  request: components['schemas']['CreateReceiptRequest']
): Promise<ReceiptDetail> {
  return apiFetch<ReceiptDetail>('/api/sales/receipts', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}


/**
 * Fetches bookings eligible for specific allocation.
 */
export async function getBookingOptions(
  headId: number,
  service: string,
  signal?: AbortSignal
): Promise<BookingOption[]> {
  return apiFetch<BookingOption[]>('/api/sales/receipts/booking-options', {
    params: { headId, service },
    signal
  });
}

export interface BankResponse {
  id: number;
  bankName: string;
  accountNumber: string;
}

/**
 * Fetches verified bank accounts list from the accounts portal.
 */
export async function getBanks(signal?: AbortSignal): Promise<BankResponse[]> {
  return apiFetch<BankResponse[]>('/api/sales/receipts/banks', { signal });
}

export interface SupplierResponse {
  id: number;
  name: string;
  code: string;
  categories: string[];
}

/**
 * Fetches verified suppliers list from the accounts portal.
 */
export async function getSuppliers(signal?: AbortSignal): Promise<SupplierResponse[]> {
  return apiFetch<SupplierResponse[]>('/api/sales/receipts/suppliers', { signal });
}
