# Implementation Phases

---

## Dependency Graph

```
Phase 1 ───► Phase 2 ───► Phase 3 ───► Phase 4 ───► Phase 5 ───► Phase 6
  (theme)      (data)       (profiles)    (calc refac)  (dash)       (about)
                                    │
                                    ▼
                               Phase 7
                            (include/exclude)
                                    │
                                    ▼
                               Phase 8
                            (max bottles)
                                    │
                                    ▼
                               Phase 9
                            (unit toggles)
                                    │
                                    ▼
                               Phase 10
                            (a11y + keyboard)
                                    │
                                    ▼
                               Phase 11
                            (export/import)
                                    │
                                    ▼
                               Phase 12
                            (docs + deploy)
```

Phases 1-6 are structural foundations and can be done sequentially. Phases 7-11 are features that build on the foundation and can be partially parallelized.

---

## Phase 1: Theme System

**Files affected:** `css/theme.css` (new), `js/storage.js` (new, partial), `js/settings.js` (new, partial), `settings.html` (new)

**Deliverable:** Theme engine works. User can toggle dark/light/OLED on a working settings page.

**Tasks:**
- [x] Create `css/theme.css` with Catppuccin Mocha (dark) + Catppuccin Latte (light) + OLED override
- [x] Create `js/storage.js` with `getSettings()` / `saveSettings()` functions
- [x] Create `settings.html` with theme toggle UI (square icon buttons + OLED pill toggle)
- [x] Create `js/settings.js` with theme toggle logic, writes to storage
- [x] Add synchronous `<script>` block to all 5 HTML pages that reads theme from storage and sets `data-theme` / `data-oled` before page renders
- [x] Update all existing HTML pages to load `css/theme.css` before other CSS
- [x] Verify no flash of wrong theme on page load

**Test:** Open any page → toggle theme → refresh → theme persists

---

## Phase 2: Data Layer + Migration

**Files affected:** `js/storage.js` (expand), `knapsnack.html` (minor), `profiles.html` (new)

**Deliverable:** New data model works. Old `knapsnack_bottles` data migrates automatically to new profile format on first load.

**Tasks:**
- [ ] Complete all `storage.js` functions: `getProfiles()`, `saveProfiles()`, `getCurrentProfile()`, `updateCurrentProfile()`, `migrateFromOldStorage()`
- [ ] Implement migration: on first load, check for old localStorage keys → create "Default" profile → write new keys
- [ ] Keep old keys intact (don't delete) for rollback
- [ ] Add `ProfileItem.defaults.maxBottles` and `maxBottlesHard` to the schema

**Test:** With old data in localStorage → load new code → verify profile created with correct bottles → old keys still exist

---

## Phase 3: Profiles Page

**Files affected:** `profiles.html` (new), `js/profiles.js` (new), `js/style.js` (add profile page init)

**Deliverable:** Full profile CRUD with bottle table editor, working sidebar, default settings per profile.

**Tasks:**
- [ ] Create `profiles.html` with sidebar + main content layout
- [ ] Create `js/profiles.js` with:
  - [ ] Profile list rendering in sidebar
  - [ ] Profile selection (highlight, load data)
  - [ ] Create new profile (modal for name)
  - [ ] Rename profile (inline edit)
  - [ ] Delete profile (confirmation dialog, at least 1 remains)
  - [ ] Bottle table editor (same as current `form.js` but in profiles page)
  - [ ] Default settings form (bag weight, overshoot, penalty, etc.)
  - [ ] Auto-save on any change
- [ ] Add nav link to profiles.html on all pages
- [ ] Move existing bottle table code from `form.js` into a shared mixin or import pattern

**Test:** Create 3 profiles, add different bottles to each, switch between them, rename one, delete one, refresh and verify persistence

---

## Phase 4: Calculator Refactor

**Files affected:** `knapsnack.html` (major), `js/form.js` (major), `js/knapsnack.js` (minor)

**Deliverable:** Calculator loads bottles + defaults from current profile. Profile dropdown to switch profiles within the page. History recording.

**Tasks:**
- [ ] Add profile dropdown selector to knapsnack.html
- [ ] Refactor `form.js` to:
  - [ ] Load bottles from `getCurrentProfile()` instead of old keys
  - [ ] Load default form values from profile defaults
  - [ ] On profile change, reload form defaults (but preserve any manual overrides)
  - [ ] On submit, save result to `knapsnack_history`
- [ ] Remove: bottle table from knapsnack.html (it's now on profiles.html)
- [ ] Add history section below results (collapsible, last 20 entries)

**Test:** Select profile → form auto-fills → calculate → switch profile → verify bottles/defaults update → history shows entry

---

## Phase 5: Dashboard (New index.html)

**Files affected:** `index.html` (rewrite), `css/pages.css` (dashboard styles)

**Deliverable:** Dashboard appears as hub page with navigation cards.

**Tasks:**
- [ ] Rewrite `index.html`:
  - [ ] Minimal hero section ("Weight Knapsnack" + tagline)
  - [ ] Dashboard card grid (4 cards: Calculator, Profiles, Settings, About)
  - [ ] Each card has icon + title + short description
  - [ ] Cards are `<a>` links to respective pages
- [ ] Add dashboard grid styles to `css/pages.css`
- [ ] Remove old features list (moved to about.html later)

**Test:** Click each card → navigates to correct page

---

## Phase 6: About Page Migration

**Files affected:** `about.html` (rewrite), `index.html` (remove features section)

**Deliverable:** About page has all the content that was previously split between index.html and about.html.

**Tasks:**
- [x] Merge "Features" cards from old `index.html` into `about.html`
- [x] Keep existing "Hey there", "What is Knapsnack?", "Why Knapsnack?" sections
- [x] Add tech stack section
- [x] Remove the old features section from `index.html`

**Test:** About page shows features, motivation, tech stack, and links back to dashboard.

---

## Phase 7: Include/Exclude Checkbox

**Files affected:** `js/profiles.js`, `js/form.js`, `js/storage.js` (bottle entry schema), `js/knapsnack.js` (filtering)

**Deliverable:** Bottle table has "Use" column. Unchecked bottles are excluded from DP calculation.

**Tasks:**
- [ ] Update `BottleMap` schema: each entry has `{ count: number, excluded: boolean }`
- [ ] Add "Use" column header to bottle table on profiles.html
- [ ] Add checkbox to each row
- [ ] Style the checkbox column
- [ ] Add keyboard support: Tab to checkbox, Space to toggle
- [ ] Update `best_combo_dp()` to filter out excluded bottles
- [ ] Save checkbox state on change

**Test:** Check/uncheck a bottle → re-calculate → excluded bottle not in result → refresh → state persists

---

## Phase 8: At Most N Bottles

**Files affected:** `js/knapsnack.js` (DP extension), `knapsnack.html` (new input), `js/form.js` (pass new options)

**Deliverable:** Calculator has max bottles input with hard/soft toggle. DP respects the constraint.

**Tasks:**
- [ ] Add `maxBottles` and `maxBottlesHard` parameters to `DPOptions` interface
- [ ] Implement hard mode: skip DP branches exceeding limit
- [ ] Implement soft mode: add excess penalty
- [ ] Add UI row: `[input number] Max Bottles` + `[checkbox] Hard limit`
- [ ] Pass values from form to DP
- [ ] Save values in profile defaults

**Test:** Set max=4 hard → verify result has ≤4 bottles → toggle soft → verify result can exceed but with penalty → no limit = full DP

---

## Phase 9: Unit Toggles

**Files affected:** `knapsnack.html`, `profiles.html`, `js/form.js`, `js/profiles.js`, `js/settings.js`

**Deliverable:** Target weight and bag weight inputs have unit toggle buttons. Values convert in-place on toggle. Preferences persist.

**Tasks:**
- [ ] Create reusable unit toggle component in `ui.js`:
  - Accepts: input element, allowed units array, current unit
  - Creates toggle button next to input
  - On click: convert value, update input, update button text
- [ ] Integrate into calculator form (target weight: kg↔lb, bag weight: g↔kg↔lb)
- [ ] Integrate into profiles page default settings (same fields)
- [ ] Save per-field unit to `Settings.units`
- [ ] On load: set unit button + placeholder based on saved preference
- [ ] Ensure conversion is mathematically correct (3 decimal places)

**Test:** Enter "10" in target weight with kg → toggle to lb → value becomes ~22.046 → toggle back → value restores to 10

---

## Phase 10: Accessibility & Keyboard Navigation

**Files affected:** `js/accessibility.js` (new), `css/a11y.css` (new), all HTML pages

**Deliverable:** Full keyboard navigation works on all pages. Screen readers get proper announcements.

**Tasks:**
- [ ] Create `js/accessibility.js` with focus trap, skip-to-content handler, announce function
- [ ] Create `css/a11y.css` with skip-link styles, focus indicators, reduced-motion, sr-only
- [ ] Add skip-to-content link to every page
- [ ] Add `aria-live` region to `#result` on knapsnack.html
- [ ] Audit all pages for correct ARIA roles (see ACCESSIBILITY.md table)
- [ ] Add focus management: after calculation, focus moves to result heading
- [ ] Add focus trap to modals (created in Phase 3)
- [ ] Add `:focus-visible` styles
- [ ] Add reduced motion support
- [ ] Test full Tab-through on every page without touching mouse

**Test:** Unplug mouse → Tab through every page → all features usable without mouse

---

## Phase 11: Export/Import

**Files affected:** `js/settings.js` (expand), `settings.html` (UI updates), `js/storage.js` (export/import functions)

**Deliverable:** Full export/import of all data as JSON file through the settings page.

**Tasks:**
- [ ] Implement `exportAllData()` in `storage.js` — gathers settings + profiles + history into envelope
- [ ] Implement `validateImport()` — checks schema, returns sanitized data
- [ ] Implement `importAllData()` — writes to all localStorage keys
- [ ] Add export button → triggers download
- [ ] Add import button → file picker → preview modal → confirm → overwrite → reload
- [ ] Add "Reset All Data" button → confirmation → clear → reload with defaults
- [ ] Style import/export section on settings page

**Test:** Export → verify file structure → delete localStorage → import file → verify all data restored

---

## Phase 12: Documentation & Deployment Updates

**Files affected:** `README.md`, `AGENTS.md`, `sitemap.xml`, `src-tauri/tauri.conf.json`

**Deliverable:** All docs reflect new architecture. Deployment configs updated.

**Tasks:**
- [ ] Update `sitemap.xml` with all 5 pages and priorities
- [ ] Update `README.md` with new feature list and page structure
- [ ] Update `AGENTS.md` with new module structure and key facts
- [ ] Update `src-tauri/tauri.conf.json` if needed (window title, etc.)
- [ ] Update `.github/workflows/static.yml` if needed (it deploys `web/` which still works)
- [ ] Add `manifest.json` for PWA support (optional stretch goal)
