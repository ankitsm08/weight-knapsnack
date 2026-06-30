# CSS Architecture

---

**Status:** Planned architecture. Currently only `theme.css` has been extracted — the rest of the CSS lives in the `styles.css` monolith (reset, base, components, nav, pages, mobile queries all in one file). The split below is the target state for future phases.

---

## File Breakdown

### `css/reset.css` — CSS Reset

Extracted from current `styles.css` lines 13-20.

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
```

### `css/theme.css` — Theme Palette

All color variables defined here. The `:root` block defines the **dark** theme (Catppuccin Mocha). The `[data-theme="light"]` selector switches to Catppuccin Latte. The `[data-oled="true"]` override forces true black when dark mode is active.

```css
:root {
  /* Catppuccin Mocha — dark theme (default) */
  --rosewater: #f5e0dc;
  --flamingo: #f2cdcd;
  --pink: #f5c2e7;
  --mauve: #cba6f7;
  --red: #f38ba8;
  --maroon: #eba0ac;
  --peach: #fab387;
  --yellow: #f9e2af;
  --green: #a6e3a1;
  --teal: #94e2d5;
  --sky: #89dceb;
  --sapphire: #74c7ec;
  --blue: #89b4fa;
  --lavender: #b4befe;

  --text: #cdd6f4;
  --subtext1: #bac2de;
  --subtext0: #a6adc8;
  --overlay2: #9399b2;
  --overlay1: #7f849c;
  --overlay0: #6c7086;
  --surface2: #585b70;
  --surface1: #45475a;
  --surface0: #313244;
  --base: #1e1e2e;
  --mantle: #181825;
  --crust: #11111b;

  /* Semantic aliases */
  --more: var(--teal);
  --less: var(--peach);
  --success: var(--green);
  --error: var(--red);
  --warning: var(--yellow);
  --info: var(--blue);
  --accent: var(--lavender);

  /* Glows */
  --glow-lavender: 0 0 15px rgba(180, 190, 254, 0.3);
  --glow-sapphire: 0 0 15px rgba(116, 199, 236, 0.3);
}

/* Light theme — Catppuccin Latte */
[data-theme="light"] {
  --rosewater: #dc8a78;
  --flamingo: #dd7878;
  --pink: #ea76cb;
  --mauve: #8839ef;
  --red: #d20f39;
  --maroon: #e64553;
  --peach: #fe640b;
  --yellow: #df8e1d;
  --green: #40a02b;
  --teal: #179299;
  --sky: #04a5e5;
  --sapphire: #209fb5;
  --blue: #1e66f5;
  --lavender: #7287fd;

  --text: #4c4f69;
  --subtext1: #5c5f77;
  --subtext0: #6c6f85;
  --overlay2: #7c7f93;
  --overlay1: #8c8fa1;
  --overlay0: #9ca0b0;
  --surface2: #acb0be;
  --surface1: #bcc0cc;
  --surface0: #ccd0da;
  --base: #eff1f5;
  --mantle: #e6e9ef;
  --crust: #dce0e8;

  /* Recalculate glows for light background */
  --glow-lavender: 0 0 15px rgba(114, 135, 253, 0.2);
  --glow-sapphire: 0 0 15px rgba(32, 159, 181, 0.2);
}

/* OLED mode — only applies in dark theme */
[data-theme="dark"][data-oled="true"] {
  --base: #000000;
  --mantle: #000000;
  --crust: #000000;
  --surface0: #0a0a0a;
  --surface1: #111111;
  --surface2: #1a1a1a;
}
```

### `css/base.css` — Base Typography & Layout

Body styles, font-face, heading styles, links, utility classes. Same as current `styles.css` lines 27-190.

### `css/components.css` — Reusable Components

Cards, buttons (all variants), forms, tables, info icons, tooltips, collapsibles, number input wrappers. Same as current `styles.css` but extracted into a single file.

### `css/nav.css` — Navbar & Mobile Menu

The sticky navbar + hamburger menu + mobile dropdown. Same as current `styles.css` lines 193-291 plus lines 987-1069.

### `css/pages.css` — Page-Specific Styles

Layout and element styles unique to specific pages:

- `.dashboard-grid` on index.html
- `.profile-layout`, `.profile-sidebar`, `.profile-content` on profiles.html
- `.settings-section` groupings on settings.html
- Any other page-specific layout

### `css/overlay.css` — Animation Overlay

Unchanged from current file. Page transition animation.

### `css/a11y.css` — Accessibility

```css
/* Skip-to-content link */
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

/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Respect reduced motion */
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
    display: none;  /* skip page transition */
  }
}
```

## Load Order

Each page loads in this order:

```html
<link rel="stylesheet" href="css/theme.css" />
<link rel="stylesheet" href="css/reset.css" />
<link rel="stylesheet" href="css/base.css" />
<link rel="stylesheet" href="css/nav.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/pages.css" />
<link rel="stylesheet" href="css/overlay.css" />
<link rel="stylesheet" href="css/a11y.css" />
```

`theme.css` first so all CSS vars are defined immediately. `reset.css` next so all subsequent styles build on a clean base.
