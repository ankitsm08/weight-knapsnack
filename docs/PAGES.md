# Page Specifications

---

## `index.html` — Dashboard

**Purpose:** App hub giving access to all major sections.

**Layout:**

```
[header/nav]
[section]
  [h1] Weight Knapsnack [/h1]
  [p] tagline [/p]
  [div.dashboard-grid]
    [card] → Knapsnack Calculator
      icon: calculator
      text: "Find the optimal bottle combo for your target weight"
    [/card]
    [card] → Manage Profiles
      icon: user-cog
      text: "Create and manage bottle inventories"
    [/card]
    [card] → Settings
      icon: settings
      text: "Theme, units, export/import"
    [/card]
    [card] → About
      icon: info
      text: "About this project"
    [/card]
  [/div]
[/section]
[footer]
```

**Cards:** Each card is a full-width clickable `<a>` styled as a card with an icon and description. On hover/focus, card gains border glow (same as existing card styles).

**Empty state:** Always shown — no special empty state needed.

**States:** N/A — purely navigational.

---

## `knapsnack.html` — Calculator

**Purpose:** Core calculator — enter target weight + bag weight + adjust settings → get optimal combo.

**Layout:**

```
[header/nav]
[main]
  [section]
    [h1] Knapsnack Calculator [/h1]
    [p] description [/p]

    [div.card] ← Current Profile indicator
      label: "Profile:" [select#profile-select] (loads from knapsnack_profiles)
      link: "Manage profiles →" (links to profiles.html)
    [/div]

    [form#knapsnack-form]
      --- Row 1: Target Weight + Bag Weight ---
      [div.form-row]
        [card] Target Weight
          unit-toggle (kg/lb) + [input] + stepper buttons
        [/card]
        [card] Bag Weight
          unit-toggle (g/kg/lb) + [input] + stepper buttons
        [/card]
      [/div]

      --- Row 2: Overshoot + Ratio + Penalty ---
      [div.form-row]
        [card-card-checkbox] Allow overshoot + [input type=checkbox] [/card]
        [card] Ratio [input type=number] [/card]
        [card] Penalty [input type=number] [/card]
      [/div]

      --- Row 3: Max Bottles ---
      [div.form-row]
        [card] Max Bottles [input type=number] + [checkbox] Hard limit [/card]
      [/div]

      --- Calculate ---
      [button] Calculate [/button]
    [/form]

    [div#result]
      (empty initially, populated on calculation)
    [/div]
  [/section]
[/main]
[footer]
```

**States:**

| State | What shows |
|-------|------------|
| Initial (no result yet) | Form + empty result div |
| Loading | Spin animation in result div, button disabled |
| Success | Result cards + combo table |
| Error | Error card with message |

**Keyboard interactions:**

- Tab through all form fields, checkboxes, and Calculate button
- Enter/Space activates Calculate button
- Ctrl+Enter from any field also submits

---

## `profiles.html` — Profile Management

**Purpose:** Create, rename, delete, and switch between profiles. Each profile has its own bottle inventory and default calculator settings.

**Layout:**

```
[header/nav]
[main]
  [h1] Manage Profiles [/h1]

  [div.profile-layout]
    --- Sidebar (desktop) / Top bar (mobile) ---
    [aside.profile-sidebar]
      [ul.profile-list]
        [li.profile-item.active] "Home Setup" [/li]
        [li.profile-item] "Travel Kit" [/li]
        [li.profile-item] "Gym" [/li]
      [/ul]
      [button] + New Profile [/button]
    [/aside]

    --- Main content ---
    [div.profile-content]
      [div.card] ← Profile name (editable inline)
        [h2] [profile name] [/h2]
        [button.rename] Rename [/button]
        [button.delete] Delete [/button]
      [/div]

      --- Defaults ---
      [div.card]
        [h3] Default Calculator Settings [/h3]
        [form-row]
          Bag Weight [input] + unit toggle
          Overshoot Ratio [input]
          Bottle Penalty [input]
          Allow Overshoot [checkbox]
          Max Bottles [input] + Hard limit [checkbox]
        [/form-row]
      [/div]

      --- Bottle Table ---
      [div.card.collapsible]
        [h3] Bottle Inventory [/h3]
        [table#bottles-table]
          [thead]
            [th] Weight (g) [/th]
            [th] Count [/th]
            [th] Use [/th]   (include/exclude checkbox)
            [th] [/th]       (remove button)
          [/thead]
          [tbody]
            [tr] [td input] [td input] [td checkbox] [td ✕ button] [/tr]
            ...
          [/tbody]
        [/table]
        [button] + Add Bottle [/button]
      [/div]
    [/div]
  [/div]
[/main]
[footer]
```

**States:**

| State | What shows |
|-------|------------|
| No profiles | Immediately create one "Default" profile — at least 1 must exist |
| Single profile | Sidebar shows 1 entry, delete button disabled |
| Multiple profiles | Full sidebar list, delete removes selected |
| Rename active | Inline text input replaces the h2 |
| Bottle table empty | Show "Add at least one bottle" hint, cannot save |
| Delete confirmation | Modal: "Delete profile X? This cannot be undone." |

**Keyboard navigation (bottle table):**

- Tab moves: Weight input → Count input → Use checkbox → Remove button → (next row) Weight input → ...
- After last Remove button → "+ Add Bottle" button
- Delete key on a cell's row: remove that row (with confirmation if only 1 row)
- Enter on any row cell: no special action

**Persistence:** Every change to bottles or defaults is immediately saved to `knapsnack_profiles` in localStorage.

---

## `settings.html` — Settings

**Purpose:** Global application settings.

**Layout:**

```
[header/nav]
[main]
  [h1] Settings [/h1]

  [div.card] ← Theme
    [h2.icon] Theme [/h2]
    [div.theme-toggle]
      [button.oled-toggle aria-pressed=false] 💧 OLED [/button]
      [button.theme-btn.active aria-label=Dark mode] 🌙 [/button]
      [button.theme-btn aria-label=Light mode] ☀️ [/button]
    [/div]
    OLED button dims and becomes non-interactive when Light is active
  [/div]

  [div.card] ← Units
    [h2.icon] Units [/h2]
    [p.text-muted] Coming soon — per-field unit preferences for target weight and bag weight. [/p]
  [/div]

  [div.card] ← Data Management
    [h2.icon] Data Management [/h2]
    [p.text-muted] Coming soon — export, import, and reset all your data. [/p]
  [/div]
[/main]
[footer]
```

**States:**

| State | What shows |
|-------|------------|
| Initial load | Theme buttons reflect saved preference. OLED shows `aria-pressed` state |
| Theme clicked | Active button highlighted with accent background and glow, theme saved to storage, applied immediately |
| OLED toggled | aria-pressed toggled, data-oled set on `<html>`, saved to storage |
| Light mode active | OLED button dimmed (`opacity: 0.35`), pointer-events disabled |
| Units section | Static placeholder card — no interaction |
| Data Management section | Static placeholder card — no interaction |

---

## `about.html` — About

**Purpose:** Project info, motivation, tech stack.

**Layout:** Same as current `about.html` (unchanged), plus the "Features" list moved from the current `index.html`.

**Content to merge:**
- "Features" cards from current `index.html` as a new section
- Existing "Hey there", "What is Knapsnack?", "Why Knapsnack?" sections from current `about.html`
- Tech stack section
- Link back to dashboard
