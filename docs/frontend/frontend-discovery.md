# Frontend Discovery Document

This document captures findings from auditing the legacy Laravel codebase, current backend services, and SvelteKit dependencies.

---

## 1. Project Environments & Discovery Details

### Existing Frontend Projects
- **Current Directory**: `d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend`
- **Setup**: SvelteKit 2.63.0, Svelte 5.56.1, Vite 8.0.16, TypeScript 6.0.3.
- **Strict Mode**: Enabled via `"strict": true` in `tsconfig.json`.

### Existing Node Tooling
- **Node.js**: `v24.11.0`
- **npm**: `11.6.1`
- **Vite**: `^8.0.16`

### Existing Package Manager
- **Package Manager**: `npm`
- **Lockfile**: [package-lock.json](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/package-lock.json)

### Backend Environment URL
- **Local Dev HTTP URL**: `http://localhost:5190`
- **Local Dev HTTPS URL**: `https://localhost:7272`

### OpenAPI & API Contract Urls
- **Swagger UI**: `http://localhost:5190/swagger`
- **OpenAPI Document**: `http://localhost:5190/swagger/v1/swagger.json`
- **Sales API Base Route**: `/api/sales`

### Authentication Status
- **Backend Authentication Scheme**: JWT Bearer (`Bearer`) configured in `Program.cs`.
- **Status**: Token generation and identity endpoints are currently under design/development.
- **Production Authentication**: **BLOCKED** at this phase.
- **Development Workaround**: Development-only mock JWT credentials or authentication bypass filters to demonstrate connectivity.

### CORS Configuration Status
- **Current Backend CORS**: **Not configured** in `Program.cs`. Direct browser requests will fail.
- **Target Setup**: Add a development-specific CORS policy in the backend allowing `http://localhost:5173` with credentials and matching header methods.

---

## 2. Legacy UI Structure & Dependencies

### Legacy UI Structure (Laravel Blade)
Located in `D:/texas_sales_portal/resources/views`:
- **Base Layout**: `layouts/app.blade.php` (Bootstrap navigation, guest vs authenticated links).
- **Core Sidebar Navigation**: `navigator.blade.php` (Grouped into *Statistics*, *Services*, *Actions*, *Logout*).
- **Views**:
  - `dashboard.blade.php`: High-level summaries (flight counts, ledger summaries, booking summaries).
  - `heads/` and `leads/`: Customers and filters.
  - `ledger/` and `receipts/`: Financial balance list.
  - Services: `flights`, `visa-applications`, `holiday-packages`, `vfs-appointments`, `hotels`, `transportations`, `other-services`.

### Legacy Navigation Items
Sidebar nav details from `navigator.blade.php`:
1. **Statistics**: Dashboard, Heads, Leads, Receipts, Transaction History (Ledger).
2. **Services**: Flight Ticket, Visa Services, Holiday Packages, VFS Appointment, Hotel Booking, Transportation, Other Services.
3. **Actions**: Chargeback & Dispute, Profile Settings, Log Out.

### Legacy JS & CSS Dependencies
Audited from legacy `package.json`:
- **CSS**: Bootstrap 5.1.3, Sass 1.32, FontAwesome/Phosphor icons.
- **JS**: Vue 2.6.12 (some custom components), Axios 0.21, Popper.js 2.10, Lodash 4.17.
- **Scaffolding Tool**: Laravel Mix 6.0.6 (Webpack wrapper).

---

## 3. Frontend Migration Risks

1. **API Schema Drift**: The backend endpoints return C# DTO classes. Changes on backend routes could break the frontend.
   - *Mitigation*: Generate TypeScript interface files from Swagger JSON using `openapi-typescript` CLI automatically.
2. **Financial Precision**: Floating point variables in JS (numbers) cannot represent arbitrary decimals, causing precision loss.
   - *Mitigation*: Ensure backend returns financial sums as strings (or format strings directly) and format via `Intl.NumberFormat` with tabular font alignments.
3. **CSS Variable & Theme Synchronization**: A single shell must serve a multi-portal theme strategy.
   - *Mitigation*: Use Tailwind color variables mapped to custom CSS classes on the `html` or `body` tag (`.theme-sales`, `.theme-accounts`). Do not hardcode specific colors in UI components.
4. **State Hydration and SSR Conflicts**: Pre-rendering might flash empty templates if browser-only APIs are invoked incorrectly during SvelteKit universal loading.
   - *Mitigation*: Explicitly define Server vs Browser loading rules.
