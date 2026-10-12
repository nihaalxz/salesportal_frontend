# Frontend Financial Value Strategy

This document details the handling of decimal numbers, currencies, and display rules.

---

## 1. Number Precision in JavaScript vs .NET

- **Backend**: Uses the C# `decimal` type, which has 128-bit precision, preventing rounding discrepancies.
- **Frontend**: JavaScript represents all numbers as 64-bit floating-point values (IEEE 754 Doubles), which can lead to binary fraction rounding errors (e.g. `0.1 + 0.2 === 0.30000000000000004`).
- **OpenAPI Serialization**: Decimals are serialized as JSON numbers by default. For extremely large or highly precise numbers, they should be processed as strings, but for standard currency display, standard JSON floats are acceptable if we parse them safely.
- **Core Rule**: **No financial calculations (sums, interest, allocations, commissions) are allowed on the frontend.** The client acts strictly as a display layer. Any calculation must occur in backend services and be returned via read DTO endpoints.

---

## 2. Formatting Money in UI

We provide a central formatter utility inside [src/lib/formatters/money.ts](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/formatters/money.ts):
- **Target Currency**: BHD (Bahraini Dinar) or AED depending on context. Default is `BHD` (matching backend storage).
- **Number Formatter**: `Intl.NumberFormat('en-BH', { style: 'currency', currency: 'BHD', minimumFractionDigits: 3, maximumFractionDigits: 3 })`. (Note: BHD has 3 decimal places).

---

## 3. Tabular Numeric Styling

To prevent shifting layout sizes when numeric digits vary (like in ledgers or balances), we force CSS tabular alignment on money layouts:
```css
.amount-display {
  font-variant-numeric: tabular-nums;
  font-family: monospace; /* optional fallback */
}
```
This aligns decimals vertically, improving scannability.
