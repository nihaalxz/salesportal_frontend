# Texas travels - Sales Portal Frontend

This project is the production-quality frontend foundation for the Sales Portal, built with SvelteKit, Svelte 5 (Runes), TypeScript, Tailwind CSS v4, and shadcn-svelte.

It serves as the template for a future multi-portal sharing architecture (Sales, Accounts, Accountant, Operations).

---

## 1. Prerequisites & Environment

- **Node.js**: `v24.11.0` (LTS)
- **Package Manager**: `npm`
- **TypeScript**: `^6.0.3` (Strict Mode enabled)
- **Vite**: `^8.0.16`

### Environment Variables
Duplicate `.env.example` at the root as `.env`:
```ini
# Location of the ASP.NET Core backend (Server & Client calls)
PUBLIC_BACKEND_API_URL=http://localhost:5190
```

---

## 2. Getting Started

### Installation
Restore dependencies:
```sh
npm install
```
*Note: Peer dependencies are configured in `.npmrc` to bypass TypeScript 5 vs 6 conflicts.*

### API Contract Type Generation
Generate TypeScript models directly from the backend's OpenAPI Swagger specification:
1. Ensure the backend API server is running (port 5190).
2. Run:
```sh
npm run api:types
```
This saves types to [src/lib/api/generated/api-types.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/generated/api-types.ts).

### Running Locally
Launch the SvelteKit development server:
```sh
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Folder Architecture

The codebase is organized in a capability-oriented modular structure:
- `src/lib/api/`: Centralized `apiFetch` handler, parsing of `ProblemDetails` models, and OpenAPI generated types.
- `src/lib/auth/`: Client authentication boundaries (`AuthState` and permission checks).
- `src/lib/theme/`: Multi-portal CSS variables (`tokens.css`) and portal theme configuration (`portal-theme.ts`).
- `src/lib/layout/`: Global sidebar navigation, header, and breadcrumbs.
- `src/routes/`: Isolated view page components (Dashboard, Leads, Heads, Bookings, Cash Management, Performance).

---

## 4. Theme & Multi-Portal Architecture

Colors are defined using CSS variables inside `src/lib/theme/tokens.css`.
- Components **must not** hardcode specific tailwind colors (e.g. `bg-green-600`).
- Use Tailwind semantic colors (`bg-primary`, `text-primary-foreground`) which map dynamically to the active portal's theme coordinates.
- Themes:
  - **Sales**: `.theme-sales` (Green / Emerald shades)
  - **Accounts**: `.theme-accounts` (Yellow / Amber shades)
  - **Accountant**: `.theme-master-accountant` (Red / Crimson shades)
  - **Operations**: `.theme-operations` (Purple / Violet shades)

---

## 5. Available Scripts

- `npm run dev`: Launch local development server.
- `npm run check`: Run TypeScript compiler type assertions.
- `npm run build`: Compile and bundle SvelteKit application for production.
- `npm run preview`: Host the locally compiled production bundle.
- `npm run test:unit`: Run Vitest unit tests (formatters, parsers, clients).
- `npm run test:e2e`: Run Playwright end-to-end browser smoke checks.
