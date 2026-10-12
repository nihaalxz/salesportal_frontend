import {
  fetchCustomerAccountSummary,
  fetchCustomerApplicationsSummary,
  fetchCustomerAccountStatement,
  fetchCustomerAccountTimeline
} from '../api/customer-account-api';
import type {
  CustomerAccountSummaryResponse,
  CustomerApplicationReceivableSummary,
  AccountStatementResponse,
  AccountTimelineItemResponse
} from '../types/customer-account-types';
import { CUSTOMER_ACCOUNT_CACHE_TTL_MS } from '../constants/customer-account-constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CustomerAccountRepository {
  private summaryCache = new Map<number, CacheEntry<CustomerAccountSummaryResponse>>();
  private applicationsCache = new Map<number, CacheEntry<CustomerApplicationReceivableSummary>>();
  private statementCache = new Map<number, CacheEntry<AccountStatementResponse>>();
  private timelineCache = new Map<number, CacheEntry<AccountTimelineItemResponse[]>>();

  private isFresh<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CUSTOMER_ACCOUNT_CACHE_TTL_MS;
  }

  async getSummary(headId: number, headType: string = 'Customer', forceRefresh = true): Promise<CustomerAccountSummaryResponse> {
    const cached = this.summaryCache.get(headId);
    if (!forceRefresh && this.isFresh(cached)) {
      return cached.data;
    }

    const data = await fetchCustomerAccountSummary(headId, headType);
    this.summaryCache.set(headId, { data, timestamp: Date.now() });
    return data;
  }

  async getApplications(headId: number, headType: string = 'Customer', forceRefresh = true): Promise<CustomerApplicationReceivableSummary> {
    const cached = this.applicationsCache.get(headId);
    if (!forceRefresh && this.isFresh(cached)) {
      return cached.data;
    }

    const data = await fetchCustomerApplicationsSummary(headId, headType);
    this.applicationsCache.set(headId, { data, timestamp: Date.now() });
    return data;
  }

  async getStatement(headId: number, forceRefresh = true): Promise<AccountStatementResponse> {
    const cached = this.statementCache.get(headId);
    if (!forceRefresh && this.isFresh(cached)) {
      return cached.data;
    }

    const data = await fetchCustomerAccountStatement(headId);
    this.statementCache.set(headId, { data, timestamp: Date.now() });
    return data;
  }

  async getTimeline(headId: number, forceRefresh = true): Promise<AccountTimelineItemResponse[]> {
    const cached = this.timelineCache.get(headId);
    if (!forceRefresh && this.isFresh(cached)) {
      return cached.data;
    }

    const data = await fetchCustomerAccountTimeline(headId);
    this.timelineCache.set(headId, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(headId?: number): void {
    if (headId !== undefined) {
      this.summaryCache.delete(headId);
      this.applicationsCache.delete(headId);
      this.statementCache.delete(headId);
      this.timelineCache.delete(headId);
    } else {
      this.summaryCache.clear();
      this.applicationsCache.clear();
      this.statementCache.clear();
      this.timelineCache.clear();
    }
  }
}

export const customerAccountRepository = new CustomerAccountRepository();
