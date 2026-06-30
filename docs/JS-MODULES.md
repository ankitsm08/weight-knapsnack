# JavaScript Modules

---

## Module Summary

| File | Dependencies | Loaded on pages | Responsibility |
|------|-------------|-----------------|----------------|
| `storage.js` | none | all | Centralized localStorage manager |
| `ui.js` | `storage.js` | all | Modal, toast, confirm dialog |
| `knapsnack.js` | none | knapsnack.html | DP algorithm |
| `form.js` | `storage.js`, `knapsnack.js`, `ui.js` | knapsnack.html | Calculator form, result rendering |
| `profiles.js` | `storage.js`, `ui.js`, `accessibility.js` | profiles.html | Profile CRUD, bottle table |
| `settings.js` | `storage.js`, `ui.js` | settings.html | Settings page logic |
| `style.js` | none | all | Mobile menu, collapsibles, scroll animations |
| `animations.js` | none | all | Page transition scramble effect |
| `accessibility.js` | none | all | Focus management, tab trapping, aria |

---

## `storage.js`

Centralized wrapper over `localStorage`. Single source of truth for all reads/writes.

```typescript
// Read
function getSettings(): Settings
function getProfiles(): ProfilesData
function getCurrentProfile(): ProfileItem | null
function getHistory(): History

// Write
function saveSettings(s: Settings): void
function saveProfiles(p: ProfilesData): void
function saveHistory(h: History): void

// Convenience
function updateCurrentProfile(updates: Partial<ProfileItem>): void
function setCurrentProfileId(id: string): void

// Migration
function migrateFromOldStorage(): boolean  // returns true if migration ran

// Export/Import
function exportAllData(): string  // returns JSON string
function importAllData(json: string): { settings: Settings; profiles: ProfilesData; history: History }
  // validates schema, throws on invalid

// Reset
function clearAllData(): void

// Internal
const STORAGE_KEYS = {
  SETTINGS: 'knapsnack_settings',
  PROFILES: 'knapsnack_profiles',
  HISTORY: 'knapsnack_history',
};
```

**All functions are synchronous** — localStorage is synchronous by nature.

---

## `ui.js`

Shared UI widgets that multiple pages use.

```typescript
// Modal
function showModal(options: {
  title: string;
  body: string | HTMLElement;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}): void

function closeModal(): void

// Confirm dialog (convenience wrapper around showModal)
function showConfirm(options: {
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean>  // resolves to true/false

// Toast
function showToast(options: {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // ms, default 3000
}): void

// Button loading state
function setButtonLoading(btn: HTMLElement, loading: boolean): void
```

---

## `knapsnack.js`

The DP algorithm. Keep existing functions `parseWeight`, `parseBagWeight`, `best_combo_dp`.

**Changes:**

```typescript
/**
 * Extended DP options with max bottles support.
 */
interface DPOptions {
  allow_overshoot?: boolean;   // default true
  overshoot_ratio?: number;    // default 0.5
  bottle_penalty?: number;     // default 50
  max_bottles?: number | null; // default null (no limit)
  max_bottles_hard?: boolean;  // default true — hard vs soft limit
}

function best_combo_dp(
  bottles: { [weightGrams: number]: number },
  target_weight: number,  // grams
  bag_weight: number,     // grams
  options?: DPOptions
): { combo: { [weightGrams: number]: number }; total: number }
```

**Max bottles — Hard mode logic:**

During DP iteration, before adding a new state, check if `numBottles + count > maxBottles`. If so, skip that branch entirely.

**Max bottles — Soft mode logic:**

Add an additional penalty term when the total bottles exceed the limit:
```
excess = (numBottles + count) - maxBottles
if excess > 0:
    additional_penalty = excess * bottle_penalty * 10
```
This heavily discourages exceeding the limit without making it impossible.

---

## `form.js`

Calculator form handling. Refactored to load defaults from the current profile.

**Key changes from current:**

1. On load, read `currentProfileId` from storage, load that profile's bottles + defaults.
2. Profile selector dropdown lets user switch profiles without leaving the page.
3. "Calculate" button triggers the same flow as current — but uses `maxBottles` from the new input.
4. History is written after each successful calculation.

```typescript
function initForm(): void          // called on DOMContentLoaded
function loadProfileIntoForm(profileId: string): void
function getFormValues(): FormValues
function validateForm(): string | null  // returns error message or null
function runCalculation(): void
function renderResult(data: ResultData): string  // HTML string
function showError(message: string): void
function showLoading(): void
function collapseIfTooManyBottles(): void
```

---

## `profiles.js`

Profile CRUD and bottle table management on the profiles page.

```typescript
function initProfilesPage(): void  // called on DOMContentLoaded
function loadProfileList(): void   // render sidebar
function selectProfile(id: string): void
function createProfile(name?: string): string  // returns new ID
function renameProfile(id: string, newName: string): void
function deleteProfile(id: string): void

// Bottle table management (similar to current form.js but on profiles page)
function addBottleRow(weight?: number, count?: number): void
function removeBottleRow(btn: HTMLElement): void
function saveBottles(): BottleMap
function loadBottles(bottles: BottleMap): void

// Defaults management
function loadDefaults(defaults: ProfileDefaults): void
function saveDefaults(): void
```

---

## `settings.js`

Settings page logic.

```typescript
function initSettingsPage(): void  // called on DOMContentLoaded
function setTheme(theme: 'dark' | 'light'): void
function toggleOledMode(enabled: boolean): void
function setUnit(field: string, unit: string): void
function handleExport(): void
function handleImport(file: File): void
function handleReset(): void
```

---

## `accessibility.js`

Focus and keyboard management utilities.

```typescript
// Run on every page
function initAccessibility(): void  // called on DOMContentLoaded

// Focus trap for modals
function trapFocus(container: HTMLElement): void
function releaseFocus(): void

// Move focus to first/last element in container
function focusFirst(container: HTMLElement): void
function focusLast(container: HTMLElement): void

// Get all focusable elements in a container
function getFocusableElements(container: HTMLElement): HTMLElement[]

// Announce to screen readers
function announce(message: string, priority?: 'polite' | 'assertive'): void

// Skip-to-content link handler
function handleSkipToContent(): void
```
