# Multi-Portal Theme Strategy

This document establishes the architecture for sharing style tokens and styling structures across portals.

---

## 1. Theme-Aware Design Tokens

Rather than hardcoding specific color codes (e.g. `bg-green-600` or `text-purple-600`) inside reusable UI components, all styles reference Tailwind semantic variables mapped to CSS variables.

The CSS variables are activated by adding a wrapper class corresponding to the active portal on the root element:
- `.theme-sales` (Green CSS color mappings)
- `.theme-accounts` (Yellow CSS color mappings)
- `.theme-master-accountant` (Red CSS color mappings)
- `.theme-operations` (Purple CSS color mappings)

### Semantic Tokens Definition

Inside [tokens.css](file:///d:/freelanceprojects/TexasPortalsDotNet/salesportal_frontend/src/lib/theme/tokens.css):
- `background` / `foreground` (Base page palette)
- `card` / `card-foreground` (Dashboard aggregate structures)
- `popover` / `popover-foreground` (Dropdowns, menus)
- `primary` / `primary-foreground` (Main portal action color)
- `secondary` / `secondary-foreground` (Muted elements)
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`
- `success` (Positive financial transactions/balances)
- `warning` / `info` (Disputes, alerts)
- `border`, `input`, `ring`

---

## 2. Sales Portal Palette (Professional Green)

To avoid a "casino aesthetic" or excessive gradients, the Sales Portal employs a refined enterprise-green palette:
- **Primary Color**: Emerald/Forest Green shades. In light mode, a deep forest green (`#166534` or HSL `142 72% 29%`) for text and background actions, preventing visual fatigue.
- **Backgrounds**: Slate/zinc gray tones for canvas backgrounds, clean white for card panels.
- **Financial Indicators**:
  - Positive ledger credits: Green indicators.
  - Negative ledger debits / Outstanding balances: Deep amber or muted red/destructive tones.
- **Borders & Shapes**: Clean thin borders (`1px solid var(--border)`), subtle borders instead of massive dropshadows.

---

## 3. Dark Mode Alignment

Tokens support dark mode definitions using CSS media queries or class-based selection:
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode defaults */
  }
}
```
Or by wrapping classes under `.dark` selectors.
Initially, we prioritize light/system mode rendering with variables configured to adjust dynamically.
