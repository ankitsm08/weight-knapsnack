# Keyboard Navigation Specification

---

## Global Behavior (All Pages)

| Key | Action |
|-----|--------|
| Tab | Move focus to next focusable element in DOM order |
| Shift+Tab | Move focus to previous focusable element |
| Enter / Space | Activate focused button, link, or checkbox |
| Escape | Close modal/dropdown, return focus to trigger element |
| Tab (in modal) | Cycle focus within modal (trap) |
| Shift+Tab (in modal) | Reverse cycle within modal |

No custom hotkeys (Ctrl+ shortcuts, etc.). Standard Tab + Enter only.

---

## Dashboard (`index.html`)

| Element | Tab order | Notes |
|---------|-----------|-------|
| Skip-to-content link | 1 | Visible on focus only |
| Nav: Logo | 2 | Links to author homepage |
| Nav: Dashboard | 3 | `aria-current="page"` |
| Nav: Knapsnack | 4 | |
| Nav: Profiles | 5 | |
| Nav: Settings | 6 | |
| Nav: About | 7 | |
| Dashboard card: Knapsnack | 8 | `<a>` styled as card |
| Dashboard card: Profiles | 9 | |
| Dashboard card: Settings | 10 | |
| Dashboard card: About | 11 | |
| Footer text | — | Not focusable |

---

## Calculator (`knapsnack.html`)

| Element | Tab order | Notes |
|---------|-----------|-------|
| Skip-to-content link | 1 | |
| Nav links | 2-7 | Same as dashboard |
| Profile selector `<select>` | 8 | |
| Target weight input | 9 | Unit toggle button placed inside label, tab index after input? No — unit toggle is adjacent button, tabbable |
| Target weight unit toggle | 10 | |
| Target weight + button (stepper) | — | Stepper buttons are inside the wrapper, not tabbable (mouse-only) |
| Bag weight input | 11 | |
| Bag weight unit toggle | 12 | |
| Allow overshoot checkbox | 13 | |
| Overshoot ratio input | 14 | |
| Bottle penalty input | 15 | |
| Max bottles input | 16 | |
| Max bottles hard limit checkbox | 17 | |
| Calculate button | 18 | |

**After calculation:**
- Focus moves to the result heading (`#result h2`, `tabindex="-1"`)
- Tab from there goes to the next interactive element below the result (if any)

**Design decision:** Stepper (+/−) buttons are NOT in the tab order. They're fast-repeat mouse/ touch controls. Users can type directly into the inputs, or use native `input[type=number]` up/down arrows (keyboard accessible via Up/Down arrows when focused).

---

## Profiles Page (`profiles.html`)

### Profile List (Sidebar)

| Element | Tab order | Notes |
|---------|-----------|-------|
| Skip-to-content link | 1 | |
| Nav links | 2-7 | |
| Profile sidebar list items | 8+ | Each `<li role="option">` is tabbable |
| "+ New Profile" button | after last profile | |
| Profile name heading | — | Not focusable |
| Rename button | after new profile | |
| Delete button | after rename | |

**Profile list interaction:**
- Tab to a profile → Enter/Space selects it → loads into main area
- Arrow keys on the list: NOT supported (native Tab navigation is sufficient for small lists)
- `aria-selected` on the active item

### Bottle Table

| Cell | Tab order |
|------|-----------|
| Row 1: Weight input | first in section |
| Row 1: Count input | next |
| Row 1: Use checkbox | next |
| Row 1: Remove button | next |
| Row 2: Weight input | next |
| ... | ... |
| Last row: Remove button | last in table |
| "+ Add Bottle" button | after last row |

**Key behavior within the table:**

| Key | Action |
|-----|--------|
| Tab | Move to next cell right/down |
| Shift+Tab | Move to previous cell left/up |
| Delete | When focused on any cell in a row, remove that row (with confirmation if only 1 row) |

**Delete key handling:**
```js
document.querySelector('#bottles-table').addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && ['INPUT', 'BUTTON'].includes(e.target.tagName)) {
    const row = e.target.closest('tr');
    if (row) {
      e.preventDefault();
      // trigger remove row flow
    }
  }
});
```

---

## Settings Page (`settings.html`)

| Element | Tab order | Notes |
|---------|-----------|-------|
| Skip-to-content link | 1 | |
| Nav links | 2-7 | |
| Theme: "Dark" button | 8 | Role=radio |
| Theme: "Light" button | 9 | Role=radio |
| OLED mode checkbox | 10 | Only visible if Dark active |
| Target weight unit button | 11 | |
| Bag weight unit button | 12 | |
| Export button | 13 | Download triggers, no focus change |
| Import file input | 14 | Hidden; click on "Import Data" button triggers it |
| Reset All Data button | 15 | |

---

## Modal/Dialog Focus Trap

When any modal is open (confirm, import preview, etc.):

1. Create a backdrop that blocks interaction with page content
2. Focus the first focusable element inside the modal
3. Tab cycles within the modal only:
   - Tab on last element → focus first element
   - Shift+Tab on first element → focus last element
4. Escape closes the modal and restores focus
5. Click on backdrop closes the modal and restores focus
6. On close, focus returns to the element that triggered the modal

---

## Focus Indicator Style

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default focus for mouse clicks */
:focus:not(:focus-visible) {
  outline: none;
}
```

The `:focus-visible` polyfill is not needed — all modern browsers support it (2024+).

---

## Tab Order Verification Checklist

- [ ] Tab starts at top-left and moves logically down the page
- [ ] No element is unreachable by keyboard
- [ ] All form controls are reachable
- [ ] All buttons are reachable and activatable
- [ ] All links are reachable and activatable
- [ ] No tab order jumps erratically
- [ ] Modals trap focus
- [ ] Focus is restored when modals/dropdowns close
- [ ] Focus moves to new content after dynamic updates (calculation results)
