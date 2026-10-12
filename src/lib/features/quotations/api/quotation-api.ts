import { apiFetch, apiFetchBlob } from '$lib/api/client';

export interface QuotationItem {
  id?: number | string;
  serviceType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface CreateQuotationRequest {
  clientType: 'customer' | 'agent';
  headId?: number | null;
  customerName: string;
  customerContact?: string | null;
  customerEmail?: string | null;
  remarks?: string | null;
  items: QuotationItem[];
}

export interface QuotationSummary {
  id: number;
  documentNumber: string;
  userId: number;
  salesmanName: string;
  headId?: number | null;
  clientType: 'customer' | 'agent';
  customerName: string;
  customerContact?: string | null;
  customerEmail?: string | null;
  itemsCount: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'success' | string;
  createdAt: string;
}

export interface QuotationDetail {
  id: number;
  documentNumber: string;
  userId: number;
  salesmanName: string;
  headId?: number | null;
  clientType: 'customer' | 'agent';
  customerName: string;
  customerContact?: string | null;
  customerEmail?: string | null;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'success' | string;
  remarks?: string | null;
  createdAt: string;
  items: QuotationItem[];
}

export interface QuotationsFilterQuery {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  clientType?: string;
  status?: string;
}

export interface QuotationRequest {
  quotationNo?: string;
  quotationDate?: string;
  validUntil?: string;
  clientType: 'customer' | 'agent';
  headId?: number | null;
  customerName: string;
  customerContact?: string | null;
  customerEmail?: string | null;
  salesmanName?: string | null;
  remarksNote?: string | null;
  items: QuotationItem[];
}

export const SUPPORTED_SERVICES = [
  { id: 'VISA', label: 'VISA', subtitle: 'Visa Application & Processing' },
  { id: 'FLIGHT BOOKING', label: 'FLIGHT BOOKING', subtitle: 'Airline Tickets & Airfare' },
  { id: 'VFS APPOINTMENT', label: 'VFS APPOINTMENT', subtitle: 'Biometrics & Submission Slot' },
  { id: 'TRANSPORTATION', label: 'TRANSPORTATION', subtitle: 'Vehicle, Airport Transfer & Chauffeur' },
  { id: 'HOTEL BOOKING', label: 'HOTEL BOOKING', subtitle: 'Hotel Stay & Accommodation' },
  { id: 'HOLIDAY PACKAGES', label: 'HOLIDAY PACKAGES', subtitle: 'Tour & Vacation Package' }
];

export async function getQuotations(params: QuotationsFilterQuery = {}, signal?: AbortSignal) {
  return apiFetch<{ items: QuotationSummary[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(
    '/api/sales/quotations',
    {
      params: params as Record<string, string | number | boolean | null | undefined>,
      signal
    }
  );
}

export async function getQuotationById(idOrDoc: string | number, signal?: AbortSignal): Promise<QuotationDetail> {
  return apiFetch<QuotationDetail>(`/api/sales/quotations/${idOrDoc}`, { signal });
}

export async function createQuotation(payload: CreateQuotationRequest, signal?: AbortSignal): Promise<QuotationDetail> {
  return apiFetch<QuotationDetail>('/api/sales/quotations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });
}

export async function downloadSavedQuotationPdf(idOrDoc: string | number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/sales/quotations/${idOrDoc}/pdf`, { signal });
}

export async function generateQuotationPdf(request: QuotationRequest, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob('/api/documents/quotation/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
    signal
  });
}
