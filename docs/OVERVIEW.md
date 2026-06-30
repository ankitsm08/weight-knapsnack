# Weight Knapsnack — Project Overview

## Vision

A fully keyboard-accessible, static web app that uses dynamic programming to find optimal weighted bottle combinations for home workout backpacks. Wrapped in Tauri 2 for an offline Android APK.

## Core Philosophy

- **No build step** — the web app is pure HTML/CSS/JS served directly from `web/`
- **No framework dependencies** — just vanilla everything + Lucide icons
- **Zero server required** — all computation and persistence happens client-side
- **Keyboard-first** — every interaction must be achievable without a mouse
- **Progressive enhancement** — works in any browser, better with modern features

## Document Map

| File | What it covers |
|------|----------------|
| `OVERVIEW.md` | This file — vision, philosophy, doc map |
| `ARCHITECTURE.md` | Page structure, navigation flow, data flow diagram |
| `DATA-MODEL.md` | All localStorage schemas with TypeScript interfaces |
| `PAGES.md` | Detailed spec for every page (layout, elements, states) |
| `JS-MODULES.md` | JS module breakdown: responsibilities, exports, dep graph |
| `CSS-ARCHITECTURE.md` | CSS file split, theme system (dark/light/OLED) |
| `FEATURES.md` | Detailed specs for each feature (max bottles, unit toggle, etc.) |
| `ACCESSIBILITY.md` | Accessibility requirements, ARIA roles, screen reader support |
| `KEYBOARD-NAVIGATION.md` | Keyboard interaction specs: Tab order, shortcuts, focus management |
| `EXPORT-IMPORT-SCHEMA.md` | JSON schema for the export/import file format |
| `PHASES.md` | Implementation phases with dependency ordering |
