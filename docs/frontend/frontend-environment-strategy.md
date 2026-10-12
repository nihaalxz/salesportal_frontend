# Frontend Environment Strategy

This document details the configuration setup, typed environments, and startup validations.

---

## 1. Environment Variable Structure

We use SvelteKit's environment handling to support development, test, and production builds.

- **Private Variables** (server-only):
  - `BACKEND_API_URL`: The URL to the ASP.NET Core backend.
- **Public Variables** (safe for browser):
  - `PUBLIC_PORTAL_TYPE`: Used to specify portal configuration if needed (e.g. `sales`).

---

## 2. Startup Validation Strategy

To prevent application startup with missing configurations, we validate variables inside a server-side layout load function `src/routes/+layout.server.ts` or in a global config module:

```typescript
import { env } from '$env/dynamic/private';

export function validateEnv() {
  const required = ['BACKEND_API_URL'];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`CRITICAL STARTUP ERROR: Environment variable "${key}" is not set.`);
    }
  }
}
```

This throws an explicit error at startup/build time rather than failing silently inside page loaders.

---

## 3. Environment Example File

A [.env.example](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/.env.example) will be provided at the project root:

```ini
# Backend API Location (Server-Side connection)
BACKEND_API_URL=http://localhost:5190

# Public configurations (expose with caution)
PUBLIC_PORTAL_TYPE=sales
```
No real credentials or development keys will be committed to the repository.
