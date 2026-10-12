# Phase 10 Backend Contract Gaps

This document registers gaps identified between Phase 10 frontend UI requirements and the actual endpoints provided by the ASP.NET Core API.

---

## 1. Outstanding Bookings for a Head

- **Frontend Need**: Display a list of outstanding (unpaid or partially paid) bookings associated with a specific customer Head on their profile page.
- **Current Endpoint**: `/api/sales/bookings/flights`, `/api/sales/bookings/hotels`, etc.
- **Current Contract**: Returns all bookings owned by the authenticated salesman. Does not accept a `headId` filter.
- **Problem**: The frontend cannot retrieve bookings filtered by a specific customer Head. Fetching all bookings for the salesman and filtering client-side is a performance risk and violates pagination boundaries.
- **Proposed Backend Change**:
  - **Option A (Preferred)**: Add an optional query parameter `headId` to each of the booking type endpoints (flights, hotels, etc.).
  - **Option B**: Expose a unified endpoint `/api/sales/heads/{id}/bookings` returning a unified paginated list of all bookings for that Head (containing common fields: Reference, ServiceType, TotalAmount, OutstandingAmount, Status, Date).
- **Breaking?**: No.
- **Security Impact**: Safe. Enforces salesman ownership boundaries in the query layer.
- **Performance Impact**: Positive. Minimizes database transfer and page size footprint.
- **Recommendation**: Implement Option B in a future backend database phase, providing a single consolidated feed of all bookings for a Head. For Phase 10, this feature will be flagged as **Blocked/Partial** for E2E connectivity.

---

## 2. Dashboard Trend / Chart Data

- **Frontend Need**: Display a visual chart showing sales aggregates over time (e.g., month-on-month or day-on-day trend lines).
- **Current Endpoint**: None. Only `/api/sales/dashboard/summary` is exposed.
- **Proposed Backend Change**: Expose `/api/sales/dashboard/trend` returning daily/monthly aggregates for the salesman's active bookings.
- **Breaking?**: No.
- **Security / Performance Impact**: Safe. Can be cached effectively.
- **Recommendation**: Create a lightweight chart interface. In Phase 10, the dashboard will render only the static aggregate counts and financial metrics returned by the `/api/sales/dashboard/summary` endpoint.
