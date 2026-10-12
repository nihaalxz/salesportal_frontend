# SvelteKit Rendering Strategy

This document defines how pre-rendering, universal vs server-side loading, and state hydration are structured.

---

## 1. Pre-Rendering and Hydration

- **SSR (Server-Side Rendering)**: Enabled globally. Initial request responses are rendered to HTML on the server.
- **Hydration**: The Svelte runtime initializes inside the browser, attaching reactive event listeners to SSR-generated nodes.
- **Preloading**: Hover links utilize `data-sveltekit-preload-data="hover"` on the body to trigger fetch loaders ahead of physical clicks, improving navigation speed.

---

## 2. Server Load vs Universal Load Functions

### Server Load (`+page.server.ts` or `+layout.server.ts`)
- Runs exclusively on the SvelteKit node server.
- Used when:
  - Accessing API endpoints that require private environment variables (like API keys or internal endpoints).
  - Reading cookies directly.
  - Executing server-side authorization checks.
- Returns plain serializable data structures to Svelte pages.

### Universal Load (`+page.ts` or `+layout.ts`)
- Runs on the server during the initial load, and inside the browser during subsequent navigation.
- Used when:
  - Transforming route parameters.
  - Calling public REST endpoints directly from both the client side and the server side.

---

## 3. Environment Variables & Secret Separation

- **Private Variables**: Imported from `$env/static/private` or `$env/dynamic/private`. Available only in server-side modules (`*.server.ts`).
  - *Example*: Backend internal API endpoints, client credentials.
- **Public Variables**: Imported from `$env/static/public` or `$env/dynamic/public`. Safe for browser exposure. Prefix: `PUBLIC_`.
  - *Example*: Public configuration values, analytics identifiers.
- **Critical Policy**: Never import internal API endpoints or authorization tokens through PUBLIC_ variables.

---

## 4. Token & Session Storage Policy

- **Current Stage**: Authentication is mocked on the client.
- **Future Stage (Production)**:
  - Authentication tokens (JWTs) must be stored in secure, `httpOnly`, `SameSite=Strict`, `Secure` cookies.
  - Do **NOT** store access tokens in `localStorage` or `sessionStorage` in production to prevent Cross-Site Scripting (XSS) token theft.
  - Server-side load functions will read these cookies and forward them in authorization headers when calling backend APIs.
