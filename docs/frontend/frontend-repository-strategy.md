# Frontend Repository Strategy

This document outlines the organization strategy for the Sales Portal and future portals.

---

## 1. Repository Structure Decision

**Decision**: Maintain a multi-project monorepo inside the existing repository (`TexasPortalsDotNet`) containing sibling directories for backend and frontend services:
- `/texas_sales_portal_backend/` (ASP.NET Core backend solution)
- `/salesportal_frontend/` (SvelteKit project for Sales Portal, future portals to reside at `/accounts_portal_frontend/` or similar sibling paths, or merged into `/frontend/` under a workspace setup).

Currently:
- Sibling directories are kept flat to simplify access.
- Monorepo tooling like Nx or Turborepo is **NOT** introduced yet to avoid premature complexity.
- We will not use pnpm workspaces since the project manager is `npm` and standard SvelteKit alias rules can handle library references.

---

## 2. Rationale & Implications

### Backend / Frontend Development Workflow
- Sibling folders allow developers to make atomic commits that span both backend API contract changes and frontend model mappings.
- Local startup commands are decoupled (running `dotnet run` on the API project and `npm run dev` on the SvelteKit project).
- Local developer environments are unified under one repository root.

### Continuous Integration (CI)
- CI pipelines can trigger builds based on paths:
  - If backend files change, run backend restores, database tests, and integration tests.
  - If frontend files change, run npm clean install, type checks, lints, and Vitest/Playwright runs.
- Reduces duplicate pipeline overhead.

### Deployment Boundaries
- Frontend projects build static assets via SvelteKit adapters (e.g. `@sveltejs/adapter-node` or adapter-static if SSR is disabled).
- Deployable images can be created independently:
  - A Dockerfile inside `salesportal_frontend` builds the SvelteKit container.
  - A Dockerfile inside `texas_sales_portal_backend` builds the ASP.NET Core API container.
- Independent scaling and isolated rollout procedures are preserved.

### Future Multi-Portal Sharing
To support future sibling portals (Accounts, Accountant, Operations) sharing assets without monorepo package overhead:
1. **Design Tokens & UI Primitives**: Standardized CSS variables inside a shared namespace will be defined in this phase.
2. **API Infrastructure**: The client fetches OpenAPI JSON, and standard type generators map paths.
3. **Shared Components**: Shared libraries can be linked as local workspace dependencies or imported directly if folders are nested. Initially, code references will be organized inside `src/lib/` to facilitate clean extractions into a shared package when secondary portals are initiated.
