# Phase 10 Development Authentication Strategy

This document details the strategy to support local authenticated API calls during development and end-to-end testing, while maintaining a strict "fail-closed" security boundary in production environments.

---

## 1. Local Development Challenge

The backend endpoints are marked with `[Authorize]`. However:
- The backend's JWT Bearer configuration does not have an active issuer or validation authority configured in development.
- Sending unauthenticated requests or invalid signatures returns `401 Unauthorized` automatically.
- To prove the full SvelteKit-to-database pipeline, we need a safe way to bypass token signature verification locally without weakening production security configs.

---

## 2. Selected Strategy: Environment-Gated Mock Scheme

We will introduce a local-only custom authentication handler `DevMockAuthHandler` in the backend API project.

### Backend Implementation (`Program.cs`)
1. In `Program.cs`, we check if the host environment is development:
   ```csharp
   if (builder.Environment.IsDevelopment())
   {
       builder.Services.AddAuthentication("DevMockScheme")
           .AddScheme<AuthenticationSchemeOptions, DevMockAuthHandler>("DevMockScheme", null);
   }
   else
   {
       builder.Services.AddAuthentication("Bearer")
           .AddJwtBearer("Bearer", options => {
               // Real production JWT settings
           });
   }
   ```
2. The `DevMockAuthHandler` inspects the HTTP request `Authorization` header:
   - If the header is `Bearer dev-salesman-token`, it builds a `ClaimsPrincipal` containing a `NameIdentifier` claim value of `1` (John Salesman) and returns `AuthenticateResult.Success`.
   - Otherwise, it returns `AuthenticateResult.Fail("Invalid development token")`.

### Frontend Implementation (`session.ts` & `client.ts`)
1. The SvelteKit `apiFetch` client will automatically inject `Authorization: Bearer dev-salesman-token` if `dev === true` (development mode).
2. SvelteKit's `authState` store will fail-closed in production, defaulting to an unauthenticated session.

---

## 3. Production Isolation Guarantee

- **Gated Registration**: The custom scheme registrations and options are wrapped inside `builder.Environment.IsDevelopment()`. In staging or production runs, the backend will fail to boot or throw exceptions if any mock token is passed.
- **Fail Closed**: In the SvelteKit frontend, the session defaults to `null` and `isAuthenticated: false` when `dev === false`.
- **Backend Enforced**: Mock headers or dummy tokens are ignored by the production JWT Bearer middleware, ensuring security is governed strictly by the backend runtime.
