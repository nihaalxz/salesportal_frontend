# Frontend Package Version Strategy

This document details the selected compatible package versions, reasoning, and version update guidelines.

---

## 1. Selected Dependencies and Versions

We align with the versions scaffolded in the existing SvelteKit project and compatible stable ecosystems:

| Dependency | Selected Version | Reason / Compatibility | Update Policy |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v24.11.0` (LTS) | Installed local developer environment. Highly performant. | Hold to LTS release. |
| **Svelte** | `^5.56.1` | Stable Svelte 5 release utilizing compiler Runes (`$state`, `$derived`, `$effect`). | Minor & patch updates only. |
| **SvelteKit** | `^2.63.0` | SvelteKit 2.x, fully integrated with Svelte 5. | Patch/Minor updates. |
| **Vite** | `^8.0.16` | Vite 8 core bundler, compatible with SvelteKit 2. | Hold to minor versions. |
| **TypeScript** | `^6.0.3` | Type-safety, strict mode. Handles compiler check sync. | Sync with SvelteKit compatibility. |
| **Tailwind CSS** | `^3.4.17` or `^4.0.0` | Utility CSS mapping variables to tokens. We target stable Tailwind CSS v3/v4 depending on configuration. | Hold to stable versions. |
| **shadcn-svelte** | `^0.8.0` / CLI | Accessible primitive configurations. | Keep updated for accessibility fixes. |
| **Vitest** | `^3.0.0` | Lightweight test runner for unit tests. | Minor upgrades. |
| **Playwright** | `^1.50.0` | E2E browser automation. | Align with browser releases. |

---

## 2. Compatibility Matrix

- **Runes Mode**: Enabled on all new frontend components. Compiles correctly under Svelte 5.
- **TypeScript strict mode**: Configured in `tsconfig.json`. Any type definitions generated from OpenAPI must resolve without type warnings or `any` coercions.
- **Node runtime**: Production bundle target utilizes Node v24 LTS.
