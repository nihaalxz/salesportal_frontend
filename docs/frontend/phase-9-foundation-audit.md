# Phase 9 Foundation Audit

This document inventories and verifies all acceptance criteria from the SvelteKit frontend foundation built in Phase 9.

---

## 1. Package Dependencies & Core Tooling

| Requirement | Configured Version | Verified? | Risk | Correction Required? |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `v24.11.0` | Yes | None | No |
| **Svelte** | `^5.56.1` (Runes) | Yes | None | No |
| **SvelteKit** | `^2.63.0` | Yes | None | No |
| **TypeScript** | `^6.0.3` (Strict) | Yes | None | No |
| **Vite** | `^8.0.16` | Yes | None | No |
| **Tailwind CSS** | `^4.3.2` | Yes | Vite plugin migration completed in Phase 9 | No |
| **shadcn-svelte** | `bits-ui ^2.18.1` | Yes | TS6 peer conflict bypassed via `.npmrc` | No |
| **Vitest** | `^4.1.10` | Yes | None | No |
| **Playwright** | `^1.61.1` | Yes | None | No |

---

## 2. Infrastructure & Layout Mappings

| Criterion | Actual Evidence | Verified? | Risk | Correction Required? |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAPI Generated Types** | Generated into [api-types.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/generated/api-types.ts) | Yes | None | No |
| **API Client** | Wrapper `apiFetch` in [client.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/client.ts) serializing parameters & injecting correlation IDs | Yes | None | No |
| **ProblemDetails Parsing** | Custom mapper in [problem-details.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/problem-details.ts) parsing RFC 9457 payloads | Yes | None | No |
| **Authentication Boundary** | Gated sessions & `can()` helper inside [session.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/auth/session.ts) | Yes | Mock user active in production builds | Yes (isolate mock auth for production) |
| **Layout Shell** | Collage sidebar & mobile overlay drawer mapping [navigation.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/layout/navigation.ts) | Yes | None | No |
| **Theme Mappings** | Green theme variables defined under `.theme-sales` selector in [tokens.css](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/theme/tokens.css) | Yes | None | No |
| **Presentational Formatters** | Bahrain timezone converter ([date.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/formatters/date.ts)) & dinar display ([money.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/formatters/money.ts)) | Yes | None | No |
| **Backend CORS Mappings** | Registered `DevCorsPolicy` in backend `Program.cs` allowing `localhost:5173` & `localhost:4173` | Yes | None | No |

---

## 3. Findings & Actions

### 1. Mock Authentication Isolation Risk
* **Risk**: The current `authState` store initializes with `MOCK_USER` and `isAuthenticated: true` directly. In a production build, this would enable a salesman profile locally, although the backend API calls would fail (as the backend checks JWT bearer tokens). To enforce a strict boundary, we must check the SvelteKit `dev` environment flag and only load the mock profile if `dev === true`. In production, the session should default to `null` (fail closed).
* **Action**: Update `src/lib/auth/session.ts` and add tests verifying production mode initialization.
