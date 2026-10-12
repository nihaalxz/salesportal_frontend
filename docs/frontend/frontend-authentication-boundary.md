# Frontend Authentication Boundary

> [!WARNING]
> **PRODUCTION AUTHENTICATION IS BLOCKED**.
> No production JWT storage or authentication flows are implemented in this phase.

This document details the interface abstractions created to handle mock developer sessions.

---

## 1. Authentication Interfaces

To ensure we can switch to real authentication (such as OAuth2 / OIDC) later without rewriting layout pages, we define standard interface models inside [src/lib/auth/](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/auth/):

```typescript
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
```

---

## 2. Permission and Navigation Matching

We provide permission verification helpers:
- `can(permission: string, user: AuthUser | null): boolean`: Returns true if the user possesses the matching permission string.
- Routing guards check permissions dynamically inside layout components to hide links or redirect unauthenticated calls.

---

## 3. Development vs Production Isolation

- Development auth uses a hardcoded mock user in a dev helper class, simulating a logged-in Sales Executive (ID `1`).
- The developer mock config is completely isolated and excluded from production builds. It will trigger a compilation error or build fail if referenced in production build targets.
- Token values or placeholder passwords must not be committed to Git.
