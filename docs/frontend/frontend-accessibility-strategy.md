# Frontend Accessibility Strategy

This document outlines key accessibility (a11y) rules for Texas Portals.

---

## 1. Interaction Rules

### Focus Visibility
- Any interactive item must display a clear, high-contrast focus ring when focused using a keyboard.
- We utilize Tailwind's `focus-visible` classes: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none`.

### Keyboard Navigation
- Interactive elements must be semantic tags (`<button>`, `<a>`, `<input>`) rather than `<div>` bindings.
- Slide-over mobile sheets and user dropdown menus must support the `Escape` key to close.
- Focus traps must be active inside modal popups or sheets (standardized via shadcn-svelte/Bits UI primitives).

---

## 2. Page Hierarchy & Landmarks

- **Semantic Layout**: Layout structure utilizes HTML5 elements:
  - `<header>`: Breadcrumbs and profile menu.
  - `<aside>`: Sidebar navigation.
  - `<main>`: Core page templates.
- **Headings**: Each page template begins with a single `<h1>` tag indicating the view context, followed by sequential `<h2>`, `<h3>` headings.

---

## 3. Visual Adaptability

- **Color Independence**: Status states (Pending, Approved, Overdue) cannot use color as the sole indicator of meaning. High-contrast indicators (text badges, icons, screen-reader labels) must accompany colors.
- **Reduced Motion**: Any transitions (collapsing sidebar, mobile overlays) must respect device options:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-delay: -1ms !important;
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      background-attachment: initial !important;
      scroll-behavior: auto !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  }
  ```
