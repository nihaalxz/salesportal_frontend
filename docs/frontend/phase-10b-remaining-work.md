# Phase 10B Remaining Work Matrix

This document tracks the current verification and completion status of the Phase 10B requirements.

---

| Requirement | Current Status | Evidence | Missing Work | Command/Test Required | Final Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Remove all production-runtime mock business data from frontend** | **PASS** | Removed `MOCK_OUTSTANDING_BOOKINGS` from `[headId]/+page.svelte`. Removed hardcoded SVG chart data from `dashboard/+page.svelte`. | None | `npm run check` and visual check | **PASS** |
| **Harden development authentication (replace implicit global token with explicit DevelopmentAuthProvider)** | **PASS** | Created `dev-auth.ts` with `activeDevIdentityStore` and `getActiveDevToken()`. Used in `client.ts`. | None | `npm run test` (running `dev-auth.test.ts`) | **PASS** |
| **Implement multiple explicit development identities via allowlist** | **PASS** | Allowlist defined in `dev-auth.ts` with `salesman-a`, `salesman-b`, and `no-permission`. Backend `DevMockAuthHandler.cs` updated to map these exactly. | None | `npm run test` and `dotnet test` (specifically `DevAuthHttpTests`) | **PASS** |
| **Ensure development auth cannot activate in production** | **PASS** | Verified that frontend session initializes unauthenticated when `dev === false`. Backend `ProductionAuthIsolationTests` verify dev tokens return 401 in Production environment. | None | `dotnet test` (running `ProductionAuthIsolationTests`) | **PASS** |
| **Resolve Outstanding Bookings honestly** | **PASS** | Tab displays a contract-gap "Outstanding Bookings Unavailable" view. No fake mock records are loaded. | None | Smoke test assertion checks for "Outstanding Bookings Unavailable" | **PASS** |
| **Prove real database connectivity & no-permission 403 checks** | **PASS** | Backend `DevAuthHttpTests` verify 403 Forbidden is returned for `dev-token-no-permission` on protected Sales endpoints, and 200 for salesmen tokens. | None | `dotnet test --filter DevAuthHttpTests` | **PASS** |
| **E2E browser tests do not mock API responses and prove database connectivity** | **NOT TESTED** | Playwright config updated with a dedicated `real-backend` project. | Need to implement real-backend tests in `tests/real-backend/` and execute them. | `npx playwright test --project=real-backend` / `npm run test:e2e:real` | **NOT TESTED** |
| **Prove database commands occurred during browser flow** | **NOT TESTED** | None yet. | Need to capture database query execution logs or intercept DB commands during the real-backend Playwright run. | Capture/inspect test logs during `npm run test:e2e:real` | **NOT TESTED** |
| **Verify request cancellation / stale response protection** | **NOT TESTED** | SvelteKit pages use standard Svelte client fetching but we must verify that rapid navigation or search changes do not cause race conditions. | Code inspection and rapid navigation test simulation. | Visual check/Playwright test | **NOT TESTED** |
| **Verify real ProblemDetails handling** | **NOT TESTED** | None yet. | Verify UI handles 401, 403, 404, 400, and 500 responses gracefully by displaying proper error messages, status, and correlation IDs. | Manual browser testing / Playwright checks | **NOT TESTED** |
| **Verify correlation ID end to end** | **NOT TESTED** | None yet. | Trigger an error response and verify correlation ID is rendered on the frontend UI. | Manual verification / test checking | **NOT TESTED** |
| **Verify responsive behavior under real data** | **NOT TESTED** | None yet. | Verify views (Dashboard, Heads, Head Details, Ledger) under viewports 375, 768, 1024, 1440. | Playwright screenshot validations | **NOT TESTED** |
| **Verify accessibility using real data** | **NOT TESTED** | None yet. | Verify accessibility tags (`aria-sort`, pagination labels, search inputs) are present in real data views. | Playwright accessibility / code audit | **NOT TESTED** |
| **Verify frontend performance with real backend** | **NOT TESTED** | None yet. | Measure network request count, sequentially chained calls, and payload sizes. | Network audit | **NOT TESTED** |
