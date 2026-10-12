# Phase 10 API Contract Inventory

This document maps the actual backend endpoints available for Phase 10 read UI vertical slices, matching the schema defined in [api-types.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/generated/api-types.ts).

---

## 1. Endpoint Mappings

### 1. Dashboard Summary
- **Endpoint ID**: `GetDashboardSummary`
- **Method**: `GET`
- **Route**: `/api/sales/dashboard/summary`
- **Permission**: `read:dashboard` (Implicit/enforced)
- **Query Parameters**: None
- **Response Type**: `components["schemas"]["DashboardSummaryResponse"]`
- **Financial Fields**:
  - `totalPayableAmount` (decimal)
  - `totalPaidAmount` (decimal)
  - `totalPendingAmount` (decimal)
  - `totalProfit` (decimal)
  - `cashInHand` (decimal)
- **Date/Time Fields**: None
- **Status Fields**: None
- **Error Statuses**: `401 Unauthorized`
- **Frontend Module**: Dashboard (`/dashboard`)
- **Gaps**: No trend/chart endpoint exists. Service distribution must be computed client-side from the booking type counts returned in this payload.

### 2. Heads List
- **Endpoint ID**: `GetHeads`
- **Method**: `GET`
- **Route**: `/api/sales/heads`
- **Permission**: `read:heads` (Implicit/enforced)
- **Query Parameters**:
  - `page` (number, default: 1)
  - `pageSize` (number, default: 10)
  - `searchTerm` (string, optional)
  - `sortBy` (string, allowed: `firstName`, `lastName`, `balance`, `createdAt`, default: `lastName`)
  - `sortOrder` (string, allowed: `asc`, `desc`, default: `asc`)
- **Response Type**: `components["schemas"]["HeadSummaryResponsePagedResponse"]`
- **Financial Fields**:
  - `balance` (decimal)
  - `wallet` (decimal)
- **Date/Time Fields**:
  - `createdAt` (string, ISO datetime)
- **Status Fields**:
  - `status` (string)
  - `type` (string)
- **Error Statuses**: `400 Bad Request` (invalid page/pageSize/sortBy), `401 Unauthorized`
- **Frontend Module**: Heads list (`/heads`)
- **Gaps**: None.

### 3. Head Details
- **Endpoint ID**: `GetHead`
- **Method**: `GET`
- **Route**: `/api/sales/heads/{id}`
- **Permission**: `read:heads`
- **Query Parameters**: None
- **Path Parameters**:
  - `id` (number, long)
- **Response Type**: `components["schemas"]["HeadDetailResponse"]`
- **Financial Fields**:
  - `balance` (decimal)
  - `wallet` (decimal)
  - `balanceAmount` (decimal)
- **Date/Time Fields**:
  - `createdAt` (string, ISO datetime)
- **Status Fields**:
  - `status` (string)
  - `type` (string)
- **Error Statuses**: `401 Unauthorized`, `404 Not Found`
- **Frontend Module**: Head Detail (`/heads/[headId]`)
- **Gaps**: None.

### 4. Head Ledger
- **Endpoint ID**: `GetHeadLedger`
- **Method**: `GET`
- **Route**: `/api/sales/heads/{id}/ledger`
- **Permission**: `read:heads`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `pageSize` (number, default: 20)
- **Path Parameters**:
  - `id` (number, long)
- **Response Type**: `components["schemas"]["HeadLedgerEntryResponsePagedResponse"]`
- **Financial Fields**:
  - `debit` (decimal)
  - `credit` (decimal)
  - `balance` (decimal)
- **Date/Time Fields**:
  - `createdAt` (string, ISO datetime)
- **Status Fields**:
  - `type` (string, represents service type: Flight, Hotel, Visa, etc.)
- **Error Statuses**: `400 Bad Request` (paging boundaries), `401 Unauthorized`, `404 Not Found`
- **Frontend Module**: Head Ledger section (`/heads/[headId]`)
- **Gaps**: Sorting and filtering parameters (such as date ranges or type filters) are not supported by this ledger endpoint.

### 5. Outstanding Bookings for a Head
- **Endpoint ID**: None (Missing endpoint)
- **Gaps**: There is **no backend endpoint** that filters flight, hotel, or other bookings by a specific `headId`. The `BookingsController` exposes list routes (e.g. `/api/sales/bookings/flights`), but these do not accept a `headId` parameter. 

---

## 2. Inventory Summary

The backend does not support querying outstanding bookings directly for a head. We will log this gap inside `docs/frontend/phase-10-backend-contract-gaps.md` and stub the "Outstanding Bookings for a Head" view on the UI using client-side mock fixtures in tests, while reporting it as **Blocked/Partial** for end-to-end SQL Server connectivity.
