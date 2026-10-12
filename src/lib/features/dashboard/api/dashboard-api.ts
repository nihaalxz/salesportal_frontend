import { apiFetch } from '$lib/api/client';
import type { components } from '$lib/api/generated/api-types';

export type DashboardSummary = components['schemas']['DashboardSummaryResponse'];

export interface DashboardTrendPoint {
  label: string;
  date: string;
  totalValue: number;
  bookingCount: number;
}

export interface DashboardTrend {
  points: DashboardTrendPoint[];
}

/**
 * Fetches the dashboard summary metrics.
 */
export async function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/api/sales/dashboard/summary', { signal });
}

/**
 * Fetches the 7-day rolling daily sales trend.
 */
export async function getDashboardTrend(signal?: AbortSignal): Promise<DashboardTrend> {
  return apiFetch<DashboardTrend>('/api/sales/dashboard/trend', { signal });
}

export interface ProfileTargetMetrics {
  monthlyVolume: number;
  monthlyProfit: number;
  allTimeVolume: number;
  allTimeProfit: number;
  monthlyTarget?: number;
  profitTarget?: number;
}

/**
 * Fetches dedicated monthly volume and profit target metrics for profile.
 */
export async function getProfileTargetMetrics(signal?: AbortSignal): Promise<ProfileTargetMetrics> {
  return apiFetch<ProfileTargetMetrics>('/api/sales/dashboard/profile/target-metrics', { signal });
}
