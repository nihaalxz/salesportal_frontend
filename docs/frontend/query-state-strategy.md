# Query State Strategy

This document re-evaluates the query state strategy based on the complex read requirements of Phase 10: paginated heads lists, interactive head ledgers, and independent dashboard widgets.

---

## 1. Comparison of Architectural Strategies

### Option A: SvelteKit Load Functions Only
- **Implications**: All data is fetched in `+page.ts` loaders before the page renders.
- **Pros**: Clean SSR support, single source of truth.
- **Cons**: Monolithic loading. If a single query fails, the entire page fails. Independent widget refresh on the dashboard or paginating a sub-tab (like Head Ledger) forces a full page reload or full invalidate run (`invalidateAll()`), which fetches all page data again sequentially.

### Option B: TanStack Query (Svelte Query)
- **Implications**: Client-side query manager with client-side caching.
- **Pros**: Automatic request deduplication, loading states, retry, and query invalidation.
- **Cons**: Additional dependency overhead. Version compatibility challenges with Svelte 5. Caching financial balances (e.g. Head wallet balance, ledger transactions) is a major risk, as a cached stale balance could mislead a salesman.

### Option C: Hybrid Strategy (Accepted)
- **Implications**: Combine SvelteKit URL-backed state for list views with component-level reactive fetching using our `apiFetch` wrapper.
- **Pros**:
  - **URL-Backed Navigation**: List states (page, search, sort) live strictly in the URL search params, ensuring shareability and back/forward browser support.
  - **Independent Component Fetching**: Complex widgets (Dashboard summaries, Head ledgers) fetch their own data asynchronously. They can load in parallel, fail independently, show individual loading skeletons, and be refreshed individually without reloading the entire page.
  - **Zero Stale Cache Risk**: We do not store queries in a client-side global cache. Every navigation or state change initiates a fresh database-authoritative fetch, ensuring absolute financial accuracy.
  - **Clean Cancellation**: Standard JS `AbortController` is used to cancel pending network requests on tab change, search input, or component unmount.

---

## 2. Query Lifecycle & Implementation Guidelines

### 1. URL State for Lists (Heads List, Head Ledger)
- The URL `$page.url.searchParams` is the single source of truth for:
  - `page`, `pageSize`, `searchTerm`, `sortBy`, `sortOrder`.
- To update the query, we use SvelteKit's `goto` function, passing `{ keepFocus: true, replaceState: true }` to update the URL without losing keyboard focus or causing full page reloads.
- An `$effect` block inside the page or parent component watches `$page.url` changes, triggers a fetch, and manages local loading state reactive variables.

### 2. Request Cancellation & Debounce
- In search inputs, a local debounce of `300ms` is applied before navigating or refetching.
- Every fetch request instantiates a new `AbortController`. If a new search key is typed or the user navigates away, `controller.abort()` is called to terminate the obsolete query, preventing race conditions from slower network responses.

### 3. Financial Safety
- **No Client Calculations**: Authoritative values (debit, credit, ledger balance, wallet balance) are never recalculated or summed on the client from paginated datasets. We render backend-computed fields exactly as returned by the API DTOs.
- **Zero Cache**: Stale times are effectively zero. Re-entering a route or clicking refresh triggers a direct endpoint check.
