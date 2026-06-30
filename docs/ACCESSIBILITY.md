# Accessibility Requirements

---

## Principles

1. **Keyboard-only navigation** — every action possible without a mouse
2. **Screen reader support** — all dynamic content announced, all controls labeled
3. **Visual clarity** — sufficient contrast, visible focus, no information conveyed by color alone
4. **Reduced motion** — animations respect `prefers-reduced-motion`

---

## ARIA Roles & Attributes

### Global (all pages)

| Element | Attribute | Value |
|---------|-----------|-------|
| `<html>` | `lang` | `en` |
| `<nav>` | `aria-label` | `Main navigation` |
| `<main>` | `role` | `main` |
| `<main>` | `aria-label` (if multiple `<main>`) | Page-specific |
| `i[data-lucide]` | `aria-hidden` | `true` (all icons are decorative) |
| Footer | `role` | `contentinfo` |

### Calculator Page (`knapsnack.html`)

| Element | Attribute | Value |
|---------|-----------|-------|
| `#result` | `aria-live` | `polite` |
| `#result` | `aria-atomic` | `true` |
| `#result` | `role` | `region` |
| `#result` | `aria-label` | `Calculation result` |
| Profile `<select>` | `aria-label` | `Select active profile` |
| Calculate button | `aria-label` | `Calculate optimal bottle combination` |

### Profiles Page (`profiles.html`)

| Element | Attribute | Value |
|---------|-----------|-------|
| Sidebar `<ul>` | `role` | `listbox` |
| Sidebar `<li>` | `role` | `option` |
| Active sidebar item | `aria-selected` | `true` |
| Bottle table | `role` | `grid` |
| Bottle table | `aria-label` | `Bottle inventory` |
| Bottle table `<tbody>` | `role` | `rowgroup` |
| Each bottle row `<tr>` | `role` | `row` |
| Each bottle cell `<td>` | `role` | `gridcell` |
| Remove row button | `aria-label` | `Remove bottle [weight]g` |
| Delete profile button | `aria-label` | `Delete profile [name]` |

### Settings Page (`settings.html`)

| Element | Attribute | Value |
|---------|-----------|-------|
| Theme toggle buttons | `role` | `radio` |
| Theme toggle group | `role` | `radiogroup` |
| Theme toggle group | `aria-label` | `Theme selection` |
| Active theme button | `aria-checked` | `true` |

---

## Screen Reader Live Regions

**Result area** (`#result` on knapsnack.html):
```html
<div id="result" aria-live="polite" aria-atomic="true" role="region" aria-label="Calculation result"></div>
```

When a new result is rendered, screen readers announce the full content. The result includes a brief summary at the top (e.g., "Total weight 11.5 kg, exact match") that gets announced first.

**Toast notifications** (from `ui.js`):
```html
<div id="toast-container" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
```
Toasts use `assertive` priority since they indicate state changes or errors.

---

## Skip-to-Content Link

Every page has this as the **first focusable element**:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 1000;
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: var(--base);
  font-weight: 600;
}
.skip-link:focus {
  top: 0;
}
```

Each `<main>` needs:

```html
<main id="main-content" role="main">
```

---

## Focus Management

### Modals
When a modal opens:
1. Save a reference to the previously focused element
2. Focus the first focusable element in the modal (usually the confirm button)
3. Trap focus inside the modal (Tab cycles within modal, Escape closes)
4. When modal closes, restore focus to the saved element

### Tab Trapping
The `trapFocus(container)` function in `accessibility.js`:
1. Gets all focusable elements in the container
2. On Tab on the last element, moves focus to the first
3. On Shift+Tab on the first element, moves focus to the last
4. Returns a cleanup function that removes the event listener

### Result Area
After a successful calculation, focus moves to the result div's heading:
```js
document.querySelector('#result h2')?.focus();
```
The heading has `tabindex="-1"` to be programmatically focusable.

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  #animation-overlay {
    display: none;
  }
}
```

No animation should depend on timing for functionality. Every animation is purely decorative.

---

## Color & Contrast

- All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- The Catppuccin palette was designed with accessibility in mind
- No information is conveyed by color alone — the result cards use icons + labels in addition to colored text
- Focus indicators are high-contrast (2px solid accent color with 2px offset)

---

## Form Validation

- Error messages are associated with their input via `aria-describedby`
- The error message is announced via the `aria-live` region on the result div
- Required fields have `required` attribute or use `aria-required="true"`
- Placeholder text is not the only source of label information (all inputs have `<label>` elements)
