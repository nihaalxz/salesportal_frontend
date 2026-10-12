# Frontend Architecture Document

This document defines folder conventions, module structure, and boundary strategies for SvelteKit.

---

## 1. Directory Structure

We use a capability-oriented folder structure in [src/lib/](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/) to separate features from global layout primitives:

```
src/
├── lib/
│   ├── api/                # API client, ProblemDetails mapper, generated openapi types
│   ├── auth/               # Auth boundary interface (AuthSession, Permission checks)
│   ├── components/         # Shared presentation primitives (DataTable shell, StatCard, MoneyDisplay)
│   ├── layout/             # Shell sections: Sidebar, Header, Breadcrumbs
│   ├── theme/              # CSS design variables and portal activation triggers
│   ├── errors/             # Global Error bounds and boundary UI components
│   ├── formatters/         # Financial currency & timezone formatting
│   ├── stores/             # Client-only local stores (collapsible state, theme mode)
│   └── types/              # Domain-wide interfaces
├── routes/                 # SvelteKit routing tree
│   ├── +layout.svelte      # Main entry point applying shell layout & theme
│   ├── dashboard/          # Dashboard summary lists
│   ├── leads/              # Leads listings
│   ├── heads/              # Heads listings
│   ├── bookings/           # Nested bookings routes (flights, hotels, visas, vfs, holidays, transport, other)
│   ├── cash-management/    # Deposits & Ledger lists
│   └── performance/        # KPI analytics lists
```

---

## 2. Server vs Browser Responsibilities

### Server-Side Rendering (SSR)
- **Default**: Enabled. SvelteKit pre-renders templates on the server, sending HTML to the client for immediate load.
- **Data Loaders (`+page.server.ts` or `+page.ts`)**:
  - Perform validation, environment URL checks, and initial API fetching.
  - Server-side load functions fetch from the ASP.NET Core backend securely.
  - Private environment variables (e.g. `API_BASE_URL`) are read on the server side and never sent to the browser.
- **Hydration**: Client hydrates layout components, mounting dynamic event handlers (sidebar, dropdown menus).

### Browser-Side (CSR)
- Client-side routing overrides traditional page reloads, transitioning pages instantly.
- State-driven data tables request filter/page parameters directly from URL parameters.

---

## 3. Data & State Management Rules

1. **Server State**: Managed via SvelteKit `data` loaders and client queries.
2. **Client State**: Local stores are limited to genuine transient UI parameters (e.g., sidebar collapse, system alerts).
3. **URL State Integration**: Page indexes, sorting parameters, search inputs, and filters are bound to URL Search Params. This guarantees shareable URLs and correct browser back/forward history behavior.
4. **Form Management**: All inputs use standard HTML validation, passing payload objects to API endpoints securely.

---

## 4. Boundaries and Testing

- **Authentication Boundary**: Navigation checks occur client-side. The UI blocks routes if permissions are lacking.
- **Error Boundaries**: Root routes utilize SvelteKit default error fallback pages, rendering `ProblemDetails` models neatly instead of flashing raw exceptions.
- **Testing**:
  - *Vitest*: Focuses on pure logic (client URL construction, financial display formatters, ProblemDetails status mappings).
  - *Playwright*: Smoke test routes, responsive toggles, viewport breakpoints, and navigation flows.
