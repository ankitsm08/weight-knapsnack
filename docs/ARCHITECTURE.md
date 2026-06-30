# Architecture

## Page Structure

```
web/
├── index.html          # Dashboard — hub with cards linking to other pages
├── knapsnack.html      # Calculator — target weight, bag, overshoot/penalty, calculate, results
├── profiles.html       # Profile management — create/rename/delete profiles, bottle editor, defaults
├── settings.html       # Settings — theme, OLED, unit prefs, export/import
├── about.html          # About — project info, motivation, tech stack
├── sitemap.xml         # Updated page listing for SEO
├── css/
│   ├── reset.css       # CSS reset (extracted from current styles.css)
│   ├── theme.css       # Color palette variables for dark/light/OLED themes
│   ├── base.css        # Typography, links, layout primitives
│   ├── components.css  # Reusable component styles (cards, buttons, forms, tables, tooltips)
│   ├── nav.css         # Navbar + mobile menu
│   ├── pages.css       # Page-specific section styles
│   ├── overlay.css     # Animation overlay (unchanged)
│   └── a11y.css        # Focus indicators, reduced-motion, screen-reader-only
├── js/
│   ├── storage.js      # Centralized localStorage manager
│   ├── ui.js           # Shared UI components (modals, toasts, confirm dialogs)
│   ├── knapsnack.js    # DP algorithm (extended for max N bottles)
│   ├── form.js         # Calculator form + result rendering
│   ├── profiles.js     # Profile CRUD + bottle table editor
│   ├── settings.js     # Settings page logic
│   ├── style.js        # Mobile menu, collapsibles, scroll animations, dynamic year
│   ├── animations.js   # Page transition scramble effect (unchanged)
│   ├── accessibility.js# Focus management, tab trapping, aria live regions
│   └── vendor/
│       └── lucide.min.js
├── fonts/
│   └── outfit-latin.woff2
└── static/
    ├── favicon.png
    └── manifest.json   # NEW: PWA manifest (optional)
```

## Navigation Flow

```
                    ┌─────────────────────┐
                    │                     │
            ┌───────┤   index.html        │
            │       │   (Dashboard)       │
            │       │                     │
            │       └──┬──┬──┬──┬──┐      │
            │          │  │  │  │  │      │
            ▼          ▼  ▼  ▼  ▼  ▼      │
      ┌─────────┐ ┌──────┐ ┌──────┐ ┌───────┐
      │knapsnack│ │profi-│ │sett- │ │ about │
      │ .html   │ │les   │ │ings  │ │ .html │
      │         │ │.html │ │.html │ │       │
      └─────────┘ └──────┘ └──────┘ └───────┘
           │                           ▲
           └───────────────────────────┘
           (nav links on every page)
```

Every page has the same top nav with links: Dashboard, Knapsnack, Profiles, Settings, About.

## Data Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  User    │◄──►│  js/*.js     │◄──►│  localStorage │
│  Input   │    │  (modules)   │    │  (data)      │
└──────────┘    └──────────────┘    └──────────────┘
                      │
                      ▼
                ┌──────────────┐
                │  DP Engine   │
                │ (knapsnack.js)│
                └──────────────┘
                      │
                      ▼
                ┌──────────────┐
                │  Result      │
                │  Rendering   │
                └──────────────┘
```

- **Profiles page** reads/writes the `profiles` object in localStorage
- **Settings page** reads/writes the `settings` object in localStorage
- **Calculator page** reads current profile for default bottles + settings, runs DP, renders result
- **Export/Import** (on settings page) reads/writes the entire localStorage state as a JSON blob

## Key Design Decisions

1. **Profiles own bottles + defaults** — each profile has its own bottle table, default bag weight, overshoot ratio, penalty, and allow-overshoot. The calculator loads from the current profile.
2. **Settings are global** — theme, OLED mode, and unit preferences apply across all profiles.
3. **No autosave timer** — changes to bottles, settings, and profiles are saved immediately on input (same as current behavior).
4. **Calculator is stateless** — given a profile ID + current input values, it runs DP and returns a result. It does not store intermediate state.
