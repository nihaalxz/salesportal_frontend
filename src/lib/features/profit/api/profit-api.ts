import { apiFetch } from '$lib/api/client';
import { getVisaApplications } from '$lib/features/visas/api/visas-api';
import { getFlightBookings } from '$lib/features/flights/api/flights-api';
import { getHotelBookings } from '$lib/features/hotels/api/hotels-api';
import { getVfsAppointments } from '$lib/features/vfs/api/vfs-api';
import { getTransportations } from '$lib/features/transport/api/transport-api';
import { getHolidayPackages } from '$lib/features/holidays/api/holidays-api';
import { getOtherServices } from '$lib/features/other-services/api/other-services-api';

export type ProfitType = 'Normal' | 'Rejection' | 'Inhouse' | 'Adjustment';
export type SupplierCostSource = 'Estimated' | 'Approved' | 'Reconciled' | 'Rejection';

export interface SalesmanProfitRecord {
  id: number;
  salesmanId: number;
  bookingType: string;
  bookingId: number;
  documentNumber?: string;
  payableAmount: number;
  finalSupplierCost: number;
  profitAmount: number;
  profitType: ProfitType;
  supplierCostSource: SupplierCostSource;
  accountsApprovedTotal?: number;
  rejectionFee?: number;
  isFinal: boolean;
  bookingCreatedAt: string;
  finalizedAt?: string;
  lastReconciledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesmanProfitSummary {
  salesmanId: number;
  totalProfit: number;
  monthlyProfit: number;
  allTimeProfit: number;
  approvedProfit: number;
  estimatedProfit: number;
  totalBookingsCount: number;
  finalizedCount: number;
}

export interface ServiceProfitBreakdown {
  serviceType: string;
  bookingCount: number;
  payableAmount: number;
  supplierCost: number;
  profitAmount: number;
  finalizedCount: number;
}

export interface SalesmanServiceProfitSummary {
  salesmanId: number;
  totalProfit: number;
  breakdown: ServiceProfitBreakdown[];
}

export interface ApplicationProfitItem {
  id: number;
  documentNumber: string;
  serviceType: 'Visa' | 'Flight' | 'Hotel' | 'VFS' | 'Transport' | 'Holiday' | 'Other';
  clientName: string;
  payableAmount: number;
  supplierCost: number;
  profitAmount: number;
  paymentStatus: string;
  processingStatus: string;
  isSettled: boolean;
  costSource: string;
  createdAt: string;
  detailUrl: string;
}

export async function getBookingProfit(bookingType: string, bookingId: number | string): Promise<SalesmanProfitRecord | null> {
  try {
    return await apiFetch<SalesmanProfitRecord>(`/api/sales/profit/${encodeURIComponent(bookingType)}/${encodeURIComponent(bookingId)}`);
  } catch {
    return null;
  }
}

export async function getProfitSummary(salesmanId?: number): Promise<SalesmanProfitSummary | null> {
  try {
    const query = salesmanId ? `?salesmanId=${salesmanId}` : '';
    return await apiFetch<SalesmanProfitSummary>(`/api/sales/profit/summary${query}`);
  } catch {
    return null;
  }
}

export async function getMonthlyProfit(year?: number, month?: number, salesmanId?: number): Promise<{ salesmanId: number; year: number; month: number; monthlyProfit: number } | null> {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    if (salesmanId) params.append('salesmanId', String(salesmanId));
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch<{ salesmanId: number; year: number; month: number; monthlyProfit: number }>(`/api/sales/profit/monthly${query}`);
  } catch {
    return null;
  }
}

export async function getProfitByService(salesmanId?: number): Promise<SalesmanServiceProfitSummary | null> {
  try {
    const query = salesmanId ? `?salesmanId=${salesmanId}` : '';
    return await apiFetch<SalesmanServiceProfitSummary>(`/api/sales/profit/by-service${query}`);
  } catch {
    return null;
  }
}

/**
 * Fetches all authoritative salesman profit records directly from the profit ledger
 * to provide an accurate application-wise breakdown with full date filtering capabilities.
 */
export async function fetchSalesmanApplicationProfitList(): Promise<ApplicationProfitItem[]> {
  try {
    const records = await apiFetch<any[]>('/api/sales/profit/records');
    if (!records || !Array.isArray(records)) return [];

    return records.map(r => {
      const isSettled = Boolean(r.isFinal);
      const serviceType = (r.bookingType || 'Other') as ApplicationProfitItem['serviceType'];
      
      let detailUrl = `/bookings/${serviceType.toLowerCase()}s/${r.bookingId}`;
      if (serviceType === 'VFS') detailUrl = `/bookings/vfs/${r.bookingId}`;
      else if (serviceType === 'Transport') detailUrl = `/bookings/transport/${r.bookingId}`;
      else if (serviceType === 'Holiday') detailUrl = `/bookings/holidays/${r.bookingId}`;
      else if (serviceType === 'Other') detailUrl = `/bookings/other-services/${r.bookingId}`;

      const costSource = r.profitType === 'Rejection'
        ? 'Rejection'
        : (isSettled ? 'Approved' : 'Estimated');

      return {
        id: r.id,
        documentNumber: r.documentNumber || `${serviceType}-${r.bookingId}`,
        serviceType,
        clientName: r.clientName || r.documentNumber || `${serviceType} #${r.bookingId}`,
        payableAmount: Number(r.payableAmount) || 0,
        supplierCost: Number(r.finalSupplierCost) || 0,
        profitAmount: Number(r.profitAmount) || 0,
        paymentStatus: isSettled ? 'paid' : 'pending',
        processingStatus: isSettled ? 'completed' : 'processing',
        isSettled,
        costSource,
        createdAt: r.bookingCreatedAt || r.createdAt || new Date().toISOString(),
        detailUrl
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching salesman profit records:', err);
    return [];
  }
}
