export interface CustomerAccountSummaryResponse {
  headId: number;
  headName: string;
  headType: string;
  balance: number;
  currency: string;
  lastUpdated?: string | null;
}

export interface CustomerApplicationReceivableSummary {
  openApplications: number;
  totalOutstandingAmount: number;
  items: ApplicationReceivableItem[];
}

export interface ApplicationReceivableItem {
  receivableId: number;
  applicationNumber: string;
  module: string;
  totalAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface AccountTimelineItemResponse {
  id: number;
  transactionDate: string;
  eventType: string;
  referenceNumber: string;
  serviceType: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string;
  remarks?: string | null;
}

export interface AccountStatementResponse {
  summary: CustomerAccountSummaryResponse;
  timeline: AccountTimelineItemResponse[];
  openReceivablesCount: number;
}

export interface CreditBookingRequest {
  bookingId: string;
  bookingNumber: string;
  bookingModule: string;
  headId: number;
  headType: string;
  salesmanId: number;
  totalAmount: number;
  creditTerm?: string;
  autoApplyBalance?: boolean;
  idempotencyKey?: string | null;
  remarks?: string | null;
}

export interface CreditAllocationResponse {
  balanceTransactionId?: number | null;
  creditReceivableId?: number | null;
  totalAmount: number;
  balanceApplied: number;
  receivableCreated: number;
  allocationType: string;
  paymentStatus: string;
  balanceAfter: number;
  outstandingAfter: number;
  currency: string;
}
