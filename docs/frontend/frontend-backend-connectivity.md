# Frontend-Backend Connectivity

This document details the network connectivity between SvelteKit and the ASP.NET Core backend.

---

## 1. Connection Mode

We employ **direct browser calls** and **SvelteKit server-side requests** depending on the operation:

- **Server-Side Loaders**:
  - The SvelteKit server fetches data directly from the internal API URL (`BACKEND_API_URL`).
  - Access tokens are passed in headers directly.
- **Client-Side Requests**:
  - Direct browser fetch requests query the backend origin (`http://localhost:5190`).
  - This requires the backend to configure explicit CORS headers.

---

## 2. CORS Policy for Local Development

To allow browser calls from SvelteKit (`http://localhost:5173`) to ASP.NET Core API (`http://localhost:5190`):

- **Forbidden**: `AllowAnyOrigin()` with `AllowCredentials()`, as this is a security risk and is blocked by modern browsers.
- **Allowed**: We configure a specific CORS policy in the backend `Program.cs` that allows only the specific development origin:
  ```csharp
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("DevCorsPolicy", policy =>
      {
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
      });
  });
  ```
- **Production**: Production configurations must define explicit origin domains in settings (e.g. `https://sales.texastravelsbh.com`) instead of development wildcards.
