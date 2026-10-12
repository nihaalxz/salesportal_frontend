# Flight Frontend Accessibility (a11y) Verification

This document verifies the accessibility implementation of the Flight Booking frontend pages, ensuring compatibility with assistive technologies and keyboard-only navigation.

---

## 1. Keyboard Navigation & Tab Flow

We verified that a keyboard-only user can navigate the entire flight creation form sequentially using the `Tab` key:

1. **Client Type Select**: Focused first. Can be changed via Arrow keys.
2. **Head Lookup**: Can search and select using keyboard focus.
3. **Flight Route**: `FromLocation` and `ToLocation` inputs accept standard text focus.
4. **Payment Method Select**: Focused and selectable.
5. **Passenger Row(s)**:
   - Prefix Select -> Passenger Name Text Input -> Amount Decimal Input -> Expected Supplier Cost Decimal Input -> Inhouse Checkbox -> Supplier Select -> Remove Button.
6. **Add Passenger Button**: Focused and triggers row insertion on `Enter` / `Space`.
7. **Submit Button**: Focused last. Triggers submit validation on `Enter`.

Visible focus rings (`focus:ring-2 focus:ring-primary`) are styled on all inputs to provide a clear indicator to keyboard users.

---

## 2. Semantic HTML and ARIA Structure

- **Structure**: Pages use semantic block elements (`<main>` for content area, `<section>` for panels, `<header>` for titles).
- **Labels**: Every input is associated with an explicit `<label>` element containing the matching `for` attribute, enabling screen readers to read input contexts correctly.
- **Validation Notifications**: Inputs with active validation errors apply `aria-invalid="true"` dynamically, with description text linked using `aria-describedby` to speak validation error messages to users.
- **Icon Buttons**: Buttons that contain only icons (e.g. trash icon to remove passenger) include explicit `aria-label="Remove passenger"` or screen-reader-only labels (`<span class="sr-only">Remove</span>`).
