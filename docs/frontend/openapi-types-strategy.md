# OpenAPI Types Strategy

This document details the strategy for synchronizing the backend API schema with SvelteKit frontend types.

---

## 1. Type Synchronization Approach

To eliminate manual typing of API contracts and prevent API drift:
- We generate TypeScript interface contracts directly from the ASP.NET Core backend's Swagger endpoint.
- We use the lightweight, zero-dependency `openapi-typescript` tool rather than heavy generated SDK packages.
- The output contains raw TypeScript interfaces for components, paths, operations, and parameters.

---

## 2. Setup Details

### Dependency
We will add `openapi-typescript` as a devDependency in `package.json`.

### Script
We define a script `api:types` in `package.json`:
```json
"api:types": "openapi-typescript http://localhost:5190/swagger/v1/swagger.json --output src/lib/api/generated/api-types.ts"
```

### Destination
The generated file is saved at:
[src/lib/api/generated/api-types.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/api/generated/api-types.ts)

---

## 3. Drift Verification

To enforce synchronization:
1. When compile-time errors occur on the SvelteKit project, it indicates API schema changes.
2. In CI pipelines, we run type validation by executing `npm run check`. If the backend changes endpoints or DTO properties without updating the frontend references, the build fails.
3. This allows early detection of contract mismatch during developer coding iterations.
