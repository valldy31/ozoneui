# 🌌 OzoneUI (`v1.0.0`)

**The AI-Native, EU-Compliant, Zero-Dependency Web Standards UI Framework.**

Build **Admin Backends & BI Charts**, **Apple/Linear-tier Landing Pages with Parallax**, **Mobile PWAs**, **SaaS Forms & Pickers**, **3D-Tilt Marketplaces**, and **Social Networks** from a single zero-dependency Web Standards engine (**66 `<oz-*>` Custom Elements** + OKLCH Atmospheric CSS). Works in plain HTML, PHP, React, Vue, Svelte, Laravel, or streamed LLM JSON via `<oz-renderer>`.

Live Website: **[https://ozoneui.nstudios.eu](https://ozoneui.nstudios.eu)**

---

## ⚡ Quickstart (Zero-Build CDN / HTML / PHP)

Drop `ozone.css` and `ozone.js` into any project—or load directly via jsDelivr CDN (`https://cdn.jsdelivr.net/gh/valldy31/ozoneui@main/dist/ozone.css` + `ozone.js`):

```html
<!doctype html>
<html lang="en" data-oz-mode="atmospheric" data-oz-theme="dark" data-oz-sound="on">
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/valldy31/ozoneui@main/dist/ozone.css" />
  <script type="module" src="https://cdn.jsdelivr.net/gh/valldy31/ozoneui@main/dist/ozone.js"></script>
</head>
<body>
  <oz-grid cols="12" gap="20px">
    <oz-col span="8" span-md="12">
      <oz-chart type="area" title="MRR Growth" labels="Mon,Tue,Wed,Thu,Fri" data="120,180,150,290,380" glow="cyan" exportable></oz-chart>
    </oz-col>
    <oz-col span="4" span-md="12">
      <oz-ai-chat heading="Ozone Co-Pilot" model="Gemini 2.5 Pro" suggestions="Audit contrast,Build form"></oz-ai-chat>
    </oz-col>
  </oz-grid>

  <oz-command auto-discover></oz-command>
  <oz-inspector></oz-inspector>
  <oz-cookie-consent policy-url="./legal.html"></oz-cookie-consent>
</body>
</html>
```

---

## 🧩 66 Zero-Dependency Web Components

| Category | Components (`<oz-*>`) |
| :--- | :--- |
| **Core Foundation (9)** | `oz-icon`, `oz-button`, `oz-card`, `oz-badge`, `oz-input`, `oz-switch`, `oz-tabs`, `oz-dialog`, `oz-avatar` |
| **Layout, Grid & Mobile PWA (9)** | `oz-header`, `oz-footer`, `oz-breadcrumbs`, `oz-grid`, `oz-col`, `oz-split-pane`, `oz-tree`, `oz-bottom-nav`, `oz-fab` |
| **App Shell & Sidebar (2)** | `oz-app-shell`, `oz-sidebar` |
| **Forms, Pickers & Upload (12)** | `oz-select`, `oz-checkbox`, `oz-radio-group`, `oz-textarea`, `oz-slider` *(single + dual-range)*, `oz-date-picker` *(floating glass calendar popover + presets + range)*, `oz-calendar`, `oz-file-upload` *(Browse button, previews, progress)*, `oz-combobox`, `oz-color-picker`, `oz-number-input`, `oz-otp-input` |
| **Admin Backends, BI & Dev UI (10)** | `oz-stat`, `oz-chart` *(Area, Line, Bar, Donut, Sparkline)*, `oz-table`, `oz-smart-view` *(Table ↔ Chart ↔ Cards ↔ JSON)*, `oz-kanban`, `oz-code-block`, `oz-pagination`, `oz-skeleton`, `oz-empty-state`, `oz-stepper` |
| **Landing, Parallax & Motion (11)** | `oz-hero`, `oz-bento` *(drag-and-drop sortable)*, `oz-pricing`, `oz-marquee`, `oz-parallax`, `oz-reveal`, `oz-spotlight`, `oz-drawer`, `oz-dropdown`, `oz-tooltip`, `oz-hover-card` |
| **Feedback, Marketplace & Social (8)** | `oz-alert`, `oz-progress`, `oz-accordion`, `oz-timeline`, `oz-product-card`, `oz-rating`, `oz-post`, `oz-composer` |
| **AI-Native, OS & GDPR (5)** | `oz-renderer`, `oz-ai-chat`, `oz-command` (`⌘K`), `oz-inspector` (`Alt+O`), `oz-cookie-consent` |

> All form controls with `name="..."` sync automatically with native `<form>` / `FormData`, and support programmatic agent reading/filling via `Ozone.getFormData()` & `Ozone.fillForm({...})`.

---

## 🌐 Connected Website & Live Template Studio

All root pages are connected via a shared navigation header (`dist/site-shell.js`) featuring the **Controls & Options Modal** (`#btn-control-center`: Dark/Light, Atmospheric/Precision, Theme DNA `Alt+O`, AI Co-Pilot, Privacy Veil, Sound FX, 8 Brand Palettes + Custom HEX Picker, Cookie & GDPR preferences):

- **[`index.html`](./index.html)** — Flagship overview with interactive 12-col grid, mobile PWA showcase, parallax spatial card, live calendar/pickers/upload demo, and brand switcher.
- **[`demo.html`](./demo.html)** — Live Template Studio switching between 8 full templates in [`site/templates/`](./site/templates):
  - `landing.html`, `admin.html`, `app.html`, `forms.html`, `motion.html`, `mobile.html`, `marketplace.html`, `social.html`
- **[`components.html`](./components.html)** — Filterable & searchable interactive catalog for all **66 Web Components** with 1-click **Copy HTML** & **Copy AI Prompt**.
- **[`ai.html`](./ai.html)** — Zero-Config Client Brand Studio, live `<oz-renderer>` streaming JSON sandbox, and `Ozone.inspectUI()` / `Ozone.fillForm()` interactive tester.
- **[`wiki.html`](./wiki.html)** — Help Center & Developer Wiki with `<oz-tree>` sidebar, live search, copyable `<oz-code-block>` guides, and FAQ schema.
- **[`legal.html`](./legal.html)** — EU Impressum, GDPR & ePrivacy compliance matrix, OWASP XSS hardening reference, and Live LocalStorage & Consent Manager.

---

## 🛡️ EU GDPR, EAA Accessibility & OWASP Security

- **Zero Third-Party Font IP Leaks (GDPR / *LG München*)**: `ozone.css` loads zero external Google Fonts; typography uses a pure sovereign system stack (`Inter`, `SF Pro Display`, `Segoe UI`, `JetBrains Mono`).
- **Planet49-Compliant Consent (`<oz-cookie-consent>` + `Ozone.gdpr`)**: Equal-prominence **Accept All** / **Essential Only** controls, granular category preferences, `Ozone.gdpr.exportData()`, and `Ozone.gdpr.clearStorage()`.
- **Strict Offline Icon Mode (`data-oz-gdpr="strict"`)**: Disables external Iconify CDN lookups in `<oz-icon>` so zero third-party network requests leave the origin.
- **OWASP XSS Hardening**: `<oz-renderer>` strips all `on*` inline event attributes and blocks `javascript:`, `vbscript:`, and `data:text/html` URIs across JSON-to-UI schemas.
- **EU Accessibility Act (EN 301 549 / WCAG 2.1 AA)**: Keyboard `.oz-skip-link`, `:focus-visible` focus rings, semantic landmarks, and `@media (prefers-reduced-motion: reduce)` guards.

---

- **`Ozone.i18n` Multilingual Engine & Custom CTAs**: Switch locales (`Ozone.i18n.setLocale('bg')` or `.extend({...})`) across calendars, product cards, social posts, and sidebars; customize `<oz-product-card>` with `aspect="16/9"`, `no-tilt`, `unit`, `stock-percent`, `cta-label`, `secondary-href`, and `sold-out`.
- **PHP & Server-Side Rendering (SSR) Ready**: `<oz-button type="submit" name="..." value="...">` forwards native form submissions, `<oz-sidebar>` / `<oz-bottom-nav>` items with `href` render native `<a>` links, and utilities like `.oz-h-scroll`, `.oz-aspect-16-9`, and `.oz-no-print` (`@media print`) work everywhere.

## 🤖 AI SEO, LLM Tooling & IDE Autocomplete

- **AI Agent Specs**: [`llms.txt`](./llms.txt) (compact reference), [`llms-full.txt`](./llms-full.txt) (complete AI manual), and [`/.well-known/ai-plugin.json`](./.well-known/ai-plugin.json).
- **Crawler & Sitemap SEO**: [`robots.txt`](./robots.txt) and [`sitemap.xml`](./sitemap.xml) + `SoftwareSourceCode` / `FAQPage` JSON-LD structured data.
- **VS Code & TypeScript Intellisense**: [`vscode.html-custom-data.json`](./vscode.html-custom-data.json) (configured via [`.vscode/settings.json`](./.vscode/settings.json)) and [`dist/ozone.d.ts`](./dist/ozone.d.ts).

---

## 🛠️ Development with Vite & TypeScript

```bash
npm install
npm run dev     # Start local dev server
npm run build   # Type-check & build dist/ozone.js + dist/ozone.css
```

## 📄 License

MIT License — see [`legal.html`](./legal.html).
