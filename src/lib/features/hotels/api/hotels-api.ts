import { apiFetch } from '$lib/api/client';

export interface HotelGuestItem {
  id?: number;
  prefix?: string | null;
  guestName: string;
  payableAmount?: number;
  amount?: number;
  expectedSupplierCost?: number;
  supplierCost?: number;
  profit?: number;
  isInhouse?: boolean;
  supplierId?: number | null;
  supplierName?: string | null;
}

export interface HotelBookingSummary {
  id: number;
  documentNumber?: string;
  headName?: string | null;
  salesmanName?: string | null;
  guestName: string;
  hotelName?: string | null;
  country: string;
  days: number;
  checkInDate: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  processingStatus: string;
  orderStatus: string;
  payableAmount: number;
  profit: number;
  createdAt?: string;
  isDealClosed?: boolean;
  assignedOperatorName?: string | null;
  assignedAt?: string | null;
}

export interface HotelBookingSummaryPagedList {
  items: HotelBookingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HotelBookingDetail {
  id: number;
  documentNumber?: string;
  userId: number;
  headId?: number | null;
  headName?: string | null;
  clientType?: string;
  agent?: string | null;
  agentId?: number | null;
  isInhouse: boolean;
  supplierId?: number | null;
  supplierName?: string | null;
  expectedSupplierCost: number;
  payableAmount: number;
  profit: number;
  prefix?: string | null;
  guestName: string;
  hotelName?: string | null;
  careOf?: string | null;
  country: string;
  days: number;
  checkInDate: string;
  paymentMethod: string;
  bankId?: number | null;
  bankName?: string | null;
  paymentStatus: string;
  processingStatus: string;
  orderStatus: string;
  paymentProof?: string | null;
  hasSalesReturn?: boolean;
  salesReturnAmount?: number | null;
  hasPurchaseReturn?: boolean;
  purchaseReturnAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  isDealClosed?: boolean;
  guests?: HotelGuestItem[];
}

export interface CreateHotelRequest {
  clientType: string;
  headId?: number | null;
  agent?: string | null;
  agentId?: number | null;
  prefix?: string | null;
  guestName: string;
  hotelName?: string | null;
  guests?: HotelGuestItem[];
  isInhouse: boolean;
  supplierId?: number | null;
  expectedSupplierCost: number;
  amount: number;
  country: string;
  days: number;
  checkInDate: string;
  paymentMethod: string;
  bankId?: number | null;
  bankName?: string | null;
  status?: string;
  paymentProof?: string | null;
  paymentReference?: string | null;
}

export interface HotelBookingResponse {
  id: number;
  documentNumber?: string;
  guestName: string;
  hotelName?: string | null;
  payableAmount: number;
  country: string;
  days: number;
  checkInDate: string;
  paymentMethod: string;
  paymentStatus: string;
  processingStatus: string;
  orderStatus: string;
  createdAt: string;
  guests?: HotelGuestItem[];
}

export interface HeadLookup {
  id?: number;
  firstName?: string;
  lastName?: string;
  clientType?: string;
}

/**
 * Fetches a specific hotel booking detail record.
 */
export async function getHotelBookingById(id: number | string, signal?: AbortSignal): Promise<HotelBookingDetail> {
  return apiFetch<HotelBookingDetail>(`/api/sales/bookings/hotels/${id}`, { signal });
}

export interface HotelQueryParams {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  processingStatus?: string;
  searchTerm?: string;
  isDealClosed?: boolean | string;
  dealStatus?: string;
}

/**
 * Fetches the paginated hotel bookings.
 */
export async function getHotelBookings(params: HotelQueryParams, signal?: AbortSignal): Promise<HotelBookingSummaryPagedList> {
  return apiFetch<HotelBookingSummaryPagedList>('/api/sales/bookings/hotels', {
    params: params as Record<string, string | number | boolean | null | undefined>,
    signal
  });
}

/**
 * Creates a new hotel booking with idempotency.
 */
export async function createHotelBooking(
  request: CreateHotelRequest,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<HotelBookingResponse> {
  return apiFetch<HotelBookingResponse>('/api/sales/bookings/hotels', {
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
