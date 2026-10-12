# Legacy UI Migration Map

This document correlates the legacy Laravel Blade templates with the new SvelteKit routes and maps UI/UX enhancements.

---

## 1. Route Mapping Matrix

| Laravel View | Current Purpose | New Svelte Route | Reusable Components | API Endpoint | UX Problems & Improvements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dashboard.blade.php` | Aggregate metrics overview | `/dashboard` | `StatCard`, `PageHeader`, `EmptyState` | `GET /api/sales/dashboard/summary` | **Problems**: Full page reload flickering. N+1 queries. **Improvements**: Client-side single-page transitions, route-level loading state. |
| `heads/index.blade.php` | Client Heads database | `/heads` | `DataTable`, `FilterBar`, `Pagination` | `GET /api/sales/heads` | **Problems**: Hardcoded table layout, basic search. **Improvements**: Responsive design cards on mobile, URL-bound filtering. |
| `leads/index.blade.php` | Sales leads list | `/leads` | `DataTable`, `StatusBadge`, `FilterBar` | `GET /api/sales/leads` | **Problems**: Inconsistent layout grids. **Improvements**: Uniform design tokens, tabular digits. |
| `flights/index.blade.php` | Flight booking records | `/bookings/flights` | `DataTable`, `StatusBadge`, `Pagination` | `GET /api/sales/bookings/flights` | **Problems**: Complex scripts inlined. **Improvements**: Strict TypeScript DTO models, proper loading skeletons. |
| `hotels/index.blade.php` | Hotel room bookings | `/bookings/hotels` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/hotels` | **Problems**: Duplicate table definitions. **Improvements**: Standardized table components. |
| `visa-applications/index.blade.php` | Visa applications | `/bookings/visas` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/visas` | **Problems**: Hardcoded status colors. **Improvements**: Metadata status mapping system. |
| `vfs-appointments/index.blade.php` | VFS appts | `/bookings/vfs` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/vfs` | **Problems**: Form elements cluttered. **Improvements**: Structured cards. |
| `holiday-packages/index.blade.php` | Holiday package lists | `/bookings/holidays` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/holidays` | **Problems**: Layout breakages on mobile. **Improvements**: Responsive grid. |
| `transportations/index.blade.php` | Car/bus rental bookings | `/bookings/transport` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/transport` | **Problems**: Static tables. **Improvements**: URL page state sync. |
| `other-services/index.blade.php` | Miscellaneous bookings | `/bookings/other-services` | `DataTable`, `StatusBadge` | `GET /api/sales/bookings/other` | **Problems**: Lack of validation. **Improvements**: Strict type safety. |
| `ledger/index.blade.php` | User balance ledger | `/cash-management` | `MoneyDisplay`, `DataTable` | `GET /api/sales/heads/{id}/ledger` | **Problems**: Financial floats rounded incorrectly in JS. **Improvements**: Tabular figures, exact string matching formatters. |

---

## 2. Structural Improvements to Implement

1. **Eliminate Inline Scripts**: Legacy views include multiple `<script>` hooks setting variable triggers or binding jQuery events. SvelteKit uses isolated Svelte component code.
2. **Unified DataTables**: The legacy code duplicates table styling and search scripting across every index page. SvelteKit abstracts this into a reusable DataTable shell.
3. **No Layout Shift (CLS)**: SvelteKit pre-renders static frames, and using `Skeleton` elements keeps layouts stable during slow API responses.
