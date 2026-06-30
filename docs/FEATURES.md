# Feature Specifications

---

## Feature 1: At Most N Bottles

**Location:** Calculator form, max bottles row between Ratio/Penalty and Calculate button.

**UI:**
- `[input type=number min=1]` with placeholder "No limit"
- `[checkbox] "Hard limit"` — default checked

**Logic (hard mode):**
During DP iteration, before adding a new state `(new_weight, new_score, numBottles + count)`:
```
if maxBottles is not null AND numBottles + count > maxBottles:
    skip this branch entirely
```
This guarantees the result never exceeds the limit.

**Logic (soft mode):**
```
if maxBottles is not null:
    excess = (numBottles + count) - maxBottles
    if excess > 0:
        additionalPenalty = excess * bottlePenalty * 10
        newScore += additionalPenalty
```
The high multiplier makes exceeding the limit very penalizing, but keeps it as a fallback.

**Persistence:** Saved in profile defaults (`maxBottles`, `maxBottlesHard`).

---

## Feature 2: Include/Exclude Checkbox in Bottle Table

**Location:** New column "Use" in the bottle table on both profiles.html and knapsnack.html.

**UI:**
- Column header: "Use"
- Each row: `[input type=checkbox checked]`
- When unchecked, that bottle type is excluded from calculation

**Data model change:**
```
From:  { "220": 2, "330": 4, ... }
To:    { "220": { count: 2, excluded: false }, "330": { count: 4, excluded: false }, ... }
```
Saved in `ProfileItem.bottles`.

**Filtering in DP:**
```
function best_combo_dp(bottles, ...):
    // Filter out excluded bottles
    const activeBottles = {}
    for (const [weight, entry] of Object.entries(bottles)):
        if (!entry.excluded):
            activeBottles[weight] = entry.count
    // run DP with activeBottles
```

**Persistence:** Saved immediately on checkbox change.

**Tab order:** Weight → Count → Use checkbox → Remove button → (next row)

---

## Feature 3: Unit Toggles on Input Fields

**Location:** Next to Target Weight and Bag Weight inputs on the calculator and profiles pages.

**UI:** A small button/span next to the input that cycles through available units. The button shows the current unit.

Target weight cycle: `kg` ↔ `lb`
Bag weight cycle: `g` ↔ `kg` ↔ `lb`
Bottle weights: always `g` (no toggle needed)

**Behavior on toggle:**
```
Given current value V in oldUnit, and target unit newUnit:
    V_in_grams = convert(V, oldUnit)
    newValue = convert(V_in_grams, newUnit)
    update input.value = round(newValue, 3)
    update unit button text = newUnit
    save unit preference
```

Conversion functions:
```
kg → g:  * 1000
g → kg:  / 1000
lb → g:  * 453.6
g → lb:  / 453.6
lb → kg: * 0.4536
kg → lb: / 0.4536
```

**Persistence:** `Settings.units.targetWeight` and `Settings.units.bagWeight`.

**Error state:** If input is empty or invalid (NaN) when toggled, just change the unit label without modifying the value.

---

## Feature 4: Profiles System

**Location:** `profiles.html` and profile selector on `knapsnack.html`.

**See DATA-MODEL.md for schema and PAGES.md for layout.**

**CRUD operations:**

| Operation | Behavior |
|-----------|----------|
| Create | Modal asks for profile name. Default name: "Profile N". Creates with empty bottles + default defaults. |
| Rename | Inline edit. Hitting Enter or blur confirms. Empty name rejected. |
| Delete | Confirmation dialog. Cannot delete if it's the only profile. |
| Select | Click sidebar item → load that profile's data into main area. |

**On calculator page:**
- `[select]` dropdown lists all profiles (current one selected)
- Switching profiles immediately reloads bottles and defaults for that profile
- If user had unsaved changes in calculator form, they are NOT lost — the form retains manual overrides, only defaults are loaded

---

## Feature 5: Theme System (Dark/Light/OLED)

**Location:** `settings.html` + applied via `data-theme` and `data-oled` attributes on `<html>`.

State machine:
```
Default state: data-theme="dark", data-oled="false"

User clicks "Light":
  → set data-theme="light"
  → data-oled has no effect (OLED is dark-mode only)

User clicks "Dark":
  → set data-theme="dark"
  → if oledMode was saved as true, set data-oled="true"

User checks "OLED mode" (only visible when data-theme="dark"):
  → set data-oled="true"
  → --base, --mantle, --crust become #000000
  → surface colors become very dark grays

User unchecks "OLED mode":
  → set data-oled="false"
  → colors restore to Catppuccin Mocha values
```

**Persistence:** `Settings.theme` and `Settings.oledMode`. Applied on page load before any rendering.

**Implementation key:** The `<script>` that applies the theme must run synchronously in `<head>` to prevent flash of wrong theme. Same pattern as the animation script:

```html
<script>
  (function() {
    var s = JSON.parse(localStorage.getItem('knapsnack_settings') || '{}');
    if (s.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    if (s.theme === 'dark' && s.oledMode) {
      document.documentElement.setAttribute('data-oled', 'true');
    }
  })();
</script>
```

---

## Feature 6: Export/Import

**Location:** Settings page, Data Management section.

**Export flow:**
1. User clicks "Export All Data"
2. Gather `Settings` + `ProfilesData` + `History` from localStorage
3. Wrap in envelope object with version and timestamp
4. Create `Blob`, trigger download via `URL.createObjectURL`

**Import flow:**
1. User clicks "Import Data" → file picker opens (accept `.json`)
2. File read as text
3. Validate schema (`version` field + expected top-level keys)
4. Show preview modal: "This will import: [N] profiles, [M] history entries. Current data will be overwritten."
5. On confirm: write to all localStorage keys, reload page

**Export envelope format — see EXPORT-IMPORT-SCHEMA.md.**

---

## Feature 7: History of Recent Calculations

**Location:** Under or beside the result section on knapsnack.html.

**Data:** Last 50 entries stored in `knapsnack_history`.

**UI:**
- Small collapsible card "Calculation History (N)"
- Each entry shows: timestamp (relative: "2 min ago"), target weight, total weight, diff, bottle count
- Click on an entry → loads inputs into the form and re-submits

**Persistence:** Written after every successful calculation. Oldest entries dropped at 50.

---

## Feature 8: Keyboard Navigation & Accessibility

**See KEYBOARD-NAVIGATION.md and ACCESSIBILITY.md for full specs.**

**Summary:**
- Every interactive element tabbable and activatable
- Focus trap in modals
- Skip-to-content link on every page
- Live region for result announcements
- Visible focus indicators
- Reduced motion support
