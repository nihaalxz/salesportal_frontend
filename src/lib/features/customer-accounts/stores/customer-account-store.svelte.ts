import { customerAccountRepository } from '../repositories/customer-account-repository';
import type {
  CustomerAccountSummaryResponse,
  CustomerApplicationReceivableSummary,
  AccountStatementResponse,
  AccountTimelineItemResponse
} from '../types/customer-account-types';

class CustomerAccountStore {
  currentHeadId = $state<number | null>(null);
  currentHeadType = $state<string>('Customer');
  summary = $state<CustomerAccountSummaryResponse | null>(null);
  applications = $state<CustomerApplicationReceivableSummary | null>(null);
  statement = $state<AccountStatementResponse | null>(null);
  timeline = $state<AccountTimelineItemResponse[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  async selectHead(headId: number | null, headType: string = 'Customer', forceRefresh = true) {
    if (!headId) {
      this.currentHeadId = null;
      this.currentHeadType = 'Customer';
      this.summary = null;
      this.applications = null;
      this.statement = null;
      this.timeline = [];
      this.loading = false;
      this.error = null;
      return;
    }

    // Force refresh if headId changed OR headType changed (agent vs customer)
    const headTypeChanged = this.currentHeadType.toLowerCase() !== (headType || 'Customer').toLowerCase();
    if (this.currentHeadId === headId && !forceRefresh && !headTypeChanged && this.summary) {
      return; // Reuse cached data in store
    }

    this.currentHeadId = headId;
    this.currentHeadType = headType || 'Customer';
    this.loading = true;
    this.error = null;

    try {
      this.summary = await customerAccountRepository.getSummary(headId, headType, forceRefresh);
    } catch (err: any) {
      this.error = err?.message || 'Failed to load customer account summary.';
      this.summary = null;
    } finally {
      this.loading = false;
    }
  }

  async loadApplications(headId: number, headType: string = 'Customer', forceRefresh = true) {
    try {
      this.applications = await customerAccountRepository.getApplications(headId, headType, forceRefresh);
    } catch (err: any) {
      this.applications = null;
    }
  }

  async loadStatement(headId: number, forceRefresh = true) {
    this.loading = true;
    this.error = null;

    try {
      this.statement = await customerAccountRepository.getStatement(headId, forceRefresh);
      if (this.statement?.summary) {
        this.summary = this.statement.summary;
      }
    } catch (err: any) {
      this.error = err?.message || 'Failed to load customer account statement.';
      this.statement = null;
    } finally {
      this.loading = false;
    }
  }

  async loadTimeline(headId: number, forceRefresh = true) {
    try {
      this.timeline = await customerAccountRepository.getTimeline(headId, forceRefresh);
    } catch (err: any) {
      this.error = err?.message || 'Failed to load customer account timeline.';
      this.timeline = [];
    }
  }

  async refresh(headId?: number) {
    const targetId = headId ?? this.currentHeadId;
    if (!targetId) return;
    customerAccountRepository.invalidate(targetId);
    await this.selectHead(targetId, 'Customer', true);
    await this.loadApplications(targetId, 'Customer', true);
  }

  invalidate(headId?: number) {
    customerAccountRepository.invalidate(headId);
    if (headId === this.currentHeadId) {
      this.summary = null;
      this.applications = null;
      this.statement = null;
      this.timeline = [];
    }
  }
}

export const customerAccountStore = new CustomerAccountStore();
