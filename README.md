# 🌌 OzoneUI

**The AI-Native, Web-Standards Quad-Domain UI Framework of the Future.**

Build mission-critical **Admin Backends with Charts**, **Apple/Linear-tier Landing Pages**, **3D-Tilt Digital Marketplaces**, and **Live Social Networks** from a single `< 45 KB` zero-dependency Web Standards engine—using plain HTML, PHP, React, Vue, or streamed LLM JSON via `<oz-renderer>`.

---

## ⚡ Quickstart (Zero-Build CDN / XAMPP / HTML)

Drop `ozone.css` and `ozone.js` into any HTML or PHP page:

```html
<!doctype html>
<html lang="en" data-oz-mode="atmospheric" data-oz-theme="dark" data-oz-sound="on">
<head>
  <link rel="stylesheet" href="./dist/ozone.css" />
  <script type="module" src="./dist/ozone.js"></script>
</head>
<body>
  <oz-bento cols="3" sortable>
    <oz-stat title="MRR" value="$128,400" delta="+32.4%" trend="up" sparkline="40,55,48,72,95,128"></oz-stat>
    <oz-chart type="area" title="Growth" labels="Mon,Tue,Wed,Thu,Fri" data="120,180,150,290,380" glow="cyan" exportable></oz-chart>
    <oz-product-card title="Neural Synth Pro" price="$79" old-price="$129" rating="4.9" reviews="310" badge="Bestseller" seller="Aether Labs"></oz-product-card>
  </oz-bento>

  <oz-command auto-discover></oz-command>
  <oz-inspector></oz-inspector>
</body>
</html>
```

---

## 🏆 The 12 Superpowers of OzoneUI

1. **OKLCH Atmospheric Glass + Precision Enterprise Dual Engine** (`data-oz-mode="atmospheric" | "precision"`, `data-oz-theme="dark" | "light"`).
2. **Quad-Domain Component Suite**: Admin & BI (`<oz-stat>`, `<oz-chart>`, `<oz-table>`), Landing Pages (`<oz-hero>`, `<oz-bento>`, `<oz-pricing>`, `<oz-marquee>`), Marketplaces (`<oz-product-card>`, `<oz-rating>`), and Social Feeds (`<oz-post>`, `<oz-composer>`, `<oz-avatar>`).
3. **Zero-Dependency SVG Charts & Data Tables**: Area, Line, Bar, Donut, and Sparklines with interactive hover tooltips + searchable/sortable tables.
4. **Hallucination-Proof AI Prop Resolver + `/llms.txt`**: Smart attribute aliasing (`variant`/`type`/`color`) and self-healing JSON repair.
5. **`<oz-renderer>` Live Streaming JSON-to-UI Engine**: Stream partial or full JSON UI schemas directly from an AI agent into live components with safe `oz-action` dispatching.
6. **Live Theme DNA Barcode & Floating `<oz-inspector>` (`Alt+O`)**: Adjust hues, blur, radii, and modes visually and export a single `oz://...` Theme DNA string.
7. **Procedural Web Audio Synthesizer & Haptics (`Ozone.sound`)**: Zero-asset Web Audio API micro-sounds and tactile feedback.
8. **Bi-Directional AI Ghost Cursor (`Ozone.agent`)**: Smooth glowing AI Co-Pilot cursor that glides across the viewport to demonstrate or perform live actions visibly.
9. **`<oz-smart-view>` Zero-Config 4-Way Data Morphing**: Instantaneously switches any raw JSON array between **Table ↔ Chart ↔ Bento Cards ↔ Raw JSON**.
10. **`<oz-command auto-discover>` (`Cmd/Ctrl + K`)**: Automatically indexes page actions, tabs, and commands with zero manual wiring.
11. **Declarative `src=""` Live Fetch + `sortable` Drag-and-Drop Bento**: Built-in skeleton loading, polling (`poll="5s"`), and persistent grid reordering.
12. **Global Streamer Privacy Veil (`data-oz-privacy="true"`), Shared-Element Morphs (`Ozone.morph`), and 1-Click SVG/CSV Export (`exportable`)**.

---

## 🛠️ Development with Vite & TypeScript

```bash
npm install
npm run dev     # Start local dev server
npm run build   # Type-check & build dist/ozone.js + dist/ozone.css
```

## 🤖 AI Prompt Integration

Paste [`llms.txt`](./llms.txt) into your AI assistant's system prompt, `.cursorrules`, `CLAUDE.md`, or `GEMINI.md`—or call `Ozone.getAIPrompt()` directly in the browser console.
