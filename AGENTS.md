# Weight Knapsnack — Agent Guide

## Principles

Every line of code is a liability. Minimize, maintain, and keep it self-documenting. No over-engineering. Think ahead — avoid tech debt. JSDoc `@param`/`@returns` always for editor autocomplete; function descriptions only when behavior is non-obvious.

## What it is

Static HTML/CSS/JS web app using DP to find optimal bottle combos for a target workout weight. Wrapped in Tauri 2 for Android APK.

## Repo layout

- `web/` — the app: vanilla HTML/CSS/JS, no frameworks, no npm deps
- `src-tauri/` — Tauri 2 Rust shell
- `docs/` — design docs
- `python/` — legacy Flask backend, don't touch
- `.env` — holds `ANDROID_KEYSTORE_PASSWORD`; loaded by `just`

## Commands

- **Dev server**: `just dev` (runs `pnpx serve ./web/`)
- **Android build**: `just build-apk` (requires SDK/NDK, JDK 17+, keystore)
- **No tests, no linter, no typechecker** — nothing to run for verification.

## Key facts

- **No build step.** Open any `web/*.html` directly or serve with `just dev`.
- **Only external dep is Lucide icons** (`js/vendor/lucide.min.js`). After any dynamic DOM mutation, call `UI.renderIcons()`.
- **Lucide replaces `<i data-lucide="icon-name">` with `<svg>` at runtime.** CSS must target `[data-lucide]`, not `i[data-lucide]`.
- **All persistence is `localStorage`** via `Storage` namespace in `js/storage.js`.
- **Page transition animation** (`js/animations.js`) runs synchronously from `<head>` before DOM is fully parsed. Creates full-screen overlay, scrambles title, removes itself.
- **Theme sync script** runs in `<head>`. Sets `data-theme`/`data-oled` before first paint. Calls `SafeAreaBridge.setStatusBarStyle()` on Android — guard with `window.SafeAreaBridge`.
- **SafeAreaBridge** — Android-only JS bridge for status bar. `getStatusBarHeight()` on `DOMContentLoaded`. `setStatusBarStyle(bool)` in sync script and settings theme handler.
- **GitHub Pages** deploys `web/` on push to `main`.

## Stylesheets (`css/`)

Loaded in order: `overlay.css` → `theme.css` → `styles.css` → `a11y.css`.

- `overlay.css` — page transition overlay
- `theme.css` — CSS variables, Catppuccin Mocha (dark), Latte (light), OLED override
- `styles.css` — monolith: reset, layout, components, mobile queries, animations (~1900 lines)
- `a11y.css` — skip-link, sr-only, focus-visible, reduced-motion

## JS Modules

| File | Responsibility |
|------|---------------|
| `js/knapsnack.js` | DP algorithm (`best_combo_dp`), weight parsers |
| `js/calculator.js` | Calculator form, DP invocation, results, history |
| `js/profiles.js` | Profile CRUD, bottle table editor, auto-save |
| `js/storage.js` | `Storage` namespace: getters, profiles, history, migration |
| `js/ui.js` | Number inputs, icons, tooltips, modals, toasts, bottle table helpers |
| `js/settings.js` | Theme + OLED toggle, unit toggles, data export/import dispatch |
| `js/export-import.js` | `DataManager` — export/import settings, profiles, history |
| `js/style.js` | Mobile menu, collapsibles, dynamic year, scroll margin, safe area |
| `js/accessibility.js` | `announce()` (screen reader), `trapFocus()` for modals |
| `js/animations.js` | Page transition scramble (runs from `<head>`) |

## Gotchas

- **`<i>` elements** — The `<i>jugaad</i>` in about.html is real italic text, not an icon. `i { display: contents }` in mobile CSS would strip it from the DOM. Target `[data-lucide]` instead.
- **`hyphens: auto`** on mobile caused mid-word breaks in short words like "jugaad". Prefer `overflow-wrap: break-word` alone.
- **Nav transition flash** — Mobile nav base state must NOT have `transition` on `opacity`/`visibility`. Put transitions only on `.nav-links.active` to prevent visible fade-out when resizing past 768px.
- **Feature list in flex** — Text nodes in `display: flex` containers become separate flex items. Wrap inline content (text + `<i>` tags) in a `<span>` to keep them flowing as one unit.
- **`for...in` on plain objects** — Iterates enumerable properties including prototype-chain noise. Use `for...of Object.keys()` instead.
- **Profiles CLS** — On mobile, `.profile-content` with both `flex: 1` and `flex-basis: 0%` ignores `min-height`. Override to `flex: none` + `min-height: 750px` in the mobile media query to reserve space.
- **`UI.renderIcons()`** is safe to call multiple times (Lucide is idempotent). Also called via lucide `<script onload="UI.renderIcons()">` on every page.

## DP algorithm

`best_combo_dp(bottles, target_weight, bag_weight, options)` in `js/knapsnack.js:48`.

- `bottles`: `{ weightInGrams: count }` (string keys)
- `target_weight`, `bag_weight`: grams
- `options`: `allow_overshoot` (default true), `overshoot_ratio` (0.5), `bottle_penalty` (50), `max_bottles` (0 = unlimited)
- Score = `|weight_diff| + penalty × bottle_count`. Two-pass: picks best under/over.
- Uses `let dp` (reassigned each iteration, not `const`).

## Weight parsing

- `parseWeight(str)` → kg. Supports `kg`, `g`, `lb` suffixes. Bare number assumed kg.
- `parseBagWeight(str)` → grams. Same suffixes. Empty string → 0.
