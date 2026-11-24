// ============================================================================
// OzoneUI Universal Site Shell: Shared Topbar, Controls Modal, <oz-inspector>,
// <oz-command>, <oz-cookie-consent> & Cross-Page State Persistence
// ============================================================================
import Ozone from './ozone.js';

const PAGES = [
  { id: 'home',       label: 'Home',       href: 'index.html',      icon: 'rocket' },
  { id: 'demo',       label: 'Live Demo',  href: 'demo.html',       icon: 'layout' },
  { id: 'components', label: 'Components', href: 'components.html', icon: 'layers', badge: '66' },
  { id: 'ai',         label: 'AI & Brand', href: 'ai.html',         icon: 'sparkles' },
  { id: 'wiki',       label: 'Wiki',       href: 'wiki.html',       icon: 'info' },
  { id: 'legal',      label: 'EU & GDPR',  href: 'legal.html',      icon: 'shield' }
];

const SHELL_CSS = `
  .oz-site-topbar {
    position: sticky; top: 10px; z-index: 800;
    width: min(1320px, calc(100% - 28px)); margin: 12px auto 0;
    padding: 7px 14px; border-radius: var(--oz-radius-lg);
    border: 1px solid var(--oz-border-strong); box-shadow: var(--oz-shadow-lg);
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
  }
  .oz-site-topbar::before {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    background: var(--oz-surface);
    backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
    z-index: -1; pointer-events: none;
  }
  .oz-st__brand { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: inherit; font-weight: 700; font-size: 1.02rem; letter-spacing: -0.02em; white-space: nowrap; }
  .oz-st__logo { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, var(--oz-primary), var(--oz-accent)); display: grid; place-items: center; color: #fff; box-shadow: 0 0 18px var(--oz-primary-glow); flex: none; }
  .oz-st__nav { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 3px; border-radius: var(--oz-radius-sm); background: var(--oz-surface-inset); border: 1px solid var(--oz-border); }
  .oz-st__nav-head, .oz-st__nav-foot, .oz-st__burger, .oz-st__backdrop { display: none; }
  .oz-st__actions { display: flex; align-items: center; gap: 8px; flex: none; position: relative; }
  .oz-st__cc-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--oz-emerald); box-shadow: 0 0 8px var(--oz-emerald); flex: none; }
  .oz-st__cc-dot[data-veil="true"] { background: var(--oz-amber); box-shadow: 0 0 8px var(--oz-amber); }

  .oz-st__pop {
    position: absolute; top: calc(100% + 10px); right: 0; z-index: 980;
    width: min(350px, calc(100vw - 24px)); padding: 16px;
    border-radius: var(--oz-radius-md); background: var(--oz-bg-elevated);
    border: 1px solid var(--oz-border-strong); box-shadow: var(--oz-shadow-lg);
    display: none; flex-direction: column; gap: 14px;
  }
  .oz-st__pop[data-open="true"] { display: flex; animation: oz-fade-in 180ms ease; }
  .oz-st__pop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid var(--oz-border); }
  .oz-st__pop-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .oz-st__pop-btn { justify-content: flex-start !important; text-align: left; height: auto !important; padding: 9px 10px !important; gap: 8px !important; align-items: flex-start !important; }
  .oz-st__pop-btn span { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
  .oz-st__pop-btn strong { font-size: 0.78rem; font-weight: 600; }
  .oz-st__pop-btn small { font-size: 0.67rem; font-weight: 400; color: var(--oz-text-muted); }

  .oz-site-foot-wrap { margin-top: 72px; }
  @media (max-width: 980px) {
    .oz-site-topbar { padding: 8px 12px; gap: 8px; }
    .oz-st__nav { display: none; }
    .oz-st__burger { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; padding: 0; }
    .oz-st__brand oz-badge { display: none; }
    #btn-control-center { width: 34px; height: 34px; padding: 0; justify-content: center; position: relative; }
    #btn-control-center .oz-st__cc-lbl { display: none; }
    #btn-control-center .oz-st__cc-dot { position: absolute; top: 5px; right: 5px; width: 6px; height: 6px; }
    #btn-cmd-k { width: 34px; height: 34px; padding: 0; justify-content: center; }
    #btn-cmd-k span { display: none; }
    .oz-st__actions { position: static; margin-left: auto; }
    .oz-st__backdrop[data-open="true"] { display: block; position: fixed; inset: 0; z-index: 790; background: oklch(0.05 0.02 var(--oz-hue) / 0.65); backdrop-filter: blur(8px); }
    .oz-st__nav-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--oz-border); margin-bottom: 4px; }
    .oz-st__nav-foot { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--oz-border); }
    .oz-site-topbar[data-mobile-open="true"][data-mobile-style="slide"] .oz-st__nav {
      position: fixed; top: 0; right: 0; bottom: 0; width: min(310px, 84vw); z-index: 950;
      display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 18px 16px;
      background: var(--oz-bg-elevated); border-left: 1px solid var(--oz-border-strong); border-radius: var(--oz-radius-lg) 0 0 var(--oz-radius-lg); overflow-y: auto;
    }
    .oz-site-topbar[data-mobile-open="true"][data-mobile-style="modal"] .oz-st__nav {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(340px, calc(100vw - 28px)); z-index: 950;
      display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 18px;
      background: var(--oz-bg-elevated); border: 1px solid var(--oz-border-strong); border-radius: var(--oz-radius-lg); max-height: 84vh; overflow-y: auto;
    }
    .oz-site-topbar[data-mobile-open="true"][data-mobile-style="dropdown"] .oz-st__nav {
      order: 3; width: 100%; display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 12px;
      background: var(--oz-bg-elevated); border-radius: var(--oz-radius-md);
    }
  }
`;

export function initSiteShell(opts = {}) {
  const activePage = opts.page || document.body.dataset.ozPage || 'home';
  const showFooter = opts.footer !== false;

  // Restore saved site preferences
  try {
    const prefs = JSON.parse(localStorage.getItem('oz-site-prefs') || 'null');
    if (prefs) {
      if (!location.search.includes('preset=') && !location.search.includes('brand=') && prefs.preset) Ozone.dna.applyPreset(prefs.preset);
      if (prefs.theme) document.documentElement.dataset.ozTheme = prefs.theme;
      if (prefs.mode) document.documentElement.dataset.ozMode = prefs.mode;
      if (typeof prefs.privacy === 'boolean') Ozone.setPrivacyMode(prefs.privacy);
      if (typeof prefs.sound === 'boolean') Ozone.setSound(prefs.sound);
    }
  } catch {}

  const savePrefs = (patch = {}) => {
    try {
      const cur = JSON.parse(localStorage.getItem('oz-site-prefs') || '{}');
      const d = Ozone.dna.read();
      Object.assign(cur, { theme: d.theme, mode: d.mode, preset: d.preset, privacy: document.documentElement.dataset.ozPrivacy === 'true', sound: d.sound }, patch);
      localStorage.setItem('oz-site-prefs', JSON.stringify(cur));
    } catch {}
  };

  if (!document.getElementById('oz-shell-css')) {
    const st = document.createElement('style');
    st.id = 'oz-shell-css';
    st.textContent = SHELL_CSS;
    document.head.appendChild(st);
  }

  // Skip-to-content accessibility link (EAA)
  if (!document.querySelector('.oz-skip-link')) {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    const skip = document.createElement('a');
    skip.className = 'oz-skip-link';
    skip.href = `#${main?.id || 'main-content'}`;
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
  }

  // Mount Universal Topbar + Controls & Options Modal
  let hdr = document.querySelector('.oz-site-topbar');
  if (!hdr) {
    hdr = document.createElement('header');
    hdr.className = 'oz-site-topbar';
    hdr.setAttribute('data-mobile-open', 'false');
    hdr.setAttribute('data-mobile-style', 'slide');
    const skip = document.querySelector('.oz-skip-link');
    if (skip) skip.after(hdr); else document.body.prepend(hdr);
  }

  const navLinks = PAGES.map((p) => {
    const isAct = p.id === activePage;
    return `<a href="${p.href}" class="oz-btn oz-btn--sm ${isAct ? 'oz-btn--glow' : 'oz-btn--ghost'}" style="text-decoration:none;"><oz-icon name="${p.icon}" size="14"></oz-icon> ${p.label}${p.badge ? ` <oz-badge variant="cyan" style="padding:1px 6px;font-size:0.65rem;">${p.badge}</oz-badge>` : ''}</a>`;
  }).join('');

  hdr.innerHTML = `
    <a href="index.html" class="oz-st__brand">
      <span class="oz-st__logo"><oz-icon name="diamond" size="17"></oz-icon></span>
      <span data-oz-brand-text>OzoneUI</span>
      <oz-badge variant="cyan" pulse>v1.0</oz-badge>
    </a>
    <nav class="oz-st__nav" aria-label="Main Navigation">
      <div class="oz-st__nav-head">
        <strong style="font-size:0.9rem;">OzoneUI Navigation</strong>
        <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" id="btn-st-drawer-close" aria-label="Close navigation"><oz-icon name="x" size="16"></oz-icon></button>
      </div>
      ${navLinks}
      <div class="oz-st__nav-foot">
        <span class="oz-text-xs oz-muted">Quick Options</span>
        <div class="oz-st__pop-grid">
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-sh-act="theme"><oz-icon name="sun" size="13"></oz-icon> Theme</button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-sh-act="dna"><oz-icon name="wand" size="13"></oz-icon> DNA Studio</button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-sh-act="veil"><oz-icon name="shield" size="13"></oz-icon> Privacy Veil</button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-sh-act="gdpr"><oz-icon name="lock" size="13"></oz-icon> Cookies</button>
        </div>
        <span class="oz-text-xs oz-muted">Mobile Menu Style</span>
        <div class="oz-row" style="gap:6px;">
          <button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-mobile-style-set="slide">Slide</button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-mobile-style-set="modal">Modal</button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-mobile-style-set="dropdown">Dropdown</button>
        </div>
      </div>
    </nav>
    <div class="oz-st__actions">
      <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" id="btn-control-center" aria-label="Open Controls & Options" aria-expanded="false" aria-controls="studio-cc-popover">
        <oz-icon name="sliders" size="14"></oz-icon>
        <span class="oz-st__cc-lbl">Controls</span>
        <span class="oz-st__cc-dot" id="cc-active-dot" data-veil="false"></span>
      </button>
      <div class="oz-st__pop" id="studio-cc-popover" data-open="false" role="dialog" aria-label="OzoneOS Controls & Options">
        <div class="oz-st__pop-head">
          <span style="font-weight:700;font-size:0.86rem;">Controls &amp; Options</span>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" id="btn-cc-close" aria-label="Close controls" style="width:28px;height:28px;padding:0;justify-content:center;"><oz-icon name="x" size="14"></oz-icon></button>
        </div>
        <div class="oz-st__pop-grid">
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="theme"><oz-icon name="moon" size="15" style="margin-top:2px;color:var(--oz-primary);"></oz-icon><span><strong id="sh-theme-lbl">Dark Mode</strong><small>Switch Light/Dark</small></span></button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="mode"><oz-icon name="sparkles" size="15" style="margin-top:2px;color:var(--oz-cyan);"></oz-icon><span><strong id="sh-mode-lbl">Atmospheric</strong><small>Glass / Precision</small></span></button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="dna"><oz-icon name="wand" size="15" style="margin-top:2px;color:var(--oz-violet);"></oz-icon><span><strong>Theme DNA</strong><small>Alt+O Studio</small></span></button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="copilot"><oz-icon name="bot" size="15" style="margin-top:2px;color:var(--oz-emerald);"></oz-icon><span><strong>AI Co-Pilot</strong><small>Ghost Cursor</small></span></button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="veil"><oz-icon name="shield" size="15" style="margin-top:2px;"></oz-icon><span><strong id="sh-veil-lbl">Veil: Off</strong><small>Mask PII Data</small></span></button>
          <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__pop-btn" data-sh-act="sound"><oz-icon name="volume-2" size="15" style="margin-top:2px;"></oz-icon><span><strong id="sh-sound-lbl">FX: On</strong><small>Audio Chimes</small></span></button>
        </div>
        <div style="padding-top:10px;border-top:1px solid var(--oz-border);">
          <div class="oz-between" style="margin-bottom:8px;">
            <span class="oz-text-xs oz-muted">Brand Palettes</span>
            <span class="oz-text-xs oz-subtle" id="cc-preset-label">Ozone Cyber</span>
          </div>
          <div class="oz-swatch-row">
            <button type="button" class="oz-swatch-btn" data-cc-preset="ozone" title="Ozone Cyber" style="background:#00d2ff;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="emerald" title="Emerald Fintech" style="background:#10b981;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="amethyst" title="Amethyst AI" style="background:#a855f7;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="crimson" title="Crimson Pulse" style="background:#f43f5e;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="amber" title="Solar Luxury" style="background:#f59e0b;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="ocean" title="Ocean SaaS" style="background:#3b82f6;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="nordic" title="Nordic Precision" style="background:#64748b;"></button>
            <button type="button" class="oz-swatch-btn" data-cc-preset="daylight" title="Daylight Quartz" style="background:#e2e8f0;"></button>
            <input type="color" class="oz-color-input" id="cc-hex-picker" value="#00b4d8" title="Pick custom brand color" />
          </div>
        </div>
        <div class="oz-between" style="padding-top:8px;border-top:1px solid var(--oz-border);">
          <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-sh-act="gdpr"><oz-icon name="shield" size="13"></oz-icon> Cookie &amp; GDPR</button>
          <a href="wiki.html" class="oz-btn oz-btn--sm oz-btn--ghost" style="text-decoration:none;"><oz-icon name="info" size="13"></oz-icon> Wiki Help</a>
        </div>
      </div>
      <button type="button" class="oz-btn oz-btn--sm oz-btn--primary" id="btn-cmd-k" title="Command Palette (Cmd/Ctrl+K)"><oz-icon name="command" size="14"></oz-icon> <span>K</span></button>
      <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-st__burger" id="btn-mobile-menu" aria-label="Menu" aria-expanded="false"><oz-icon name="menu" size="16"></oz-icon></button>
    </div>
  `;

  let backdrop = document.getElementById('studio-mobile-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'studio-mobile-backdrop';
    backdrop.className = 'oz-st__backdrop';
    backdrop.dataset.open = 'false';
    hdr.after(backdrop);
  }

  // Mount global overlays cleanly once
  if (!document.querySelector('oz-command')) {
    const cmd = document.createElement('oz-command');
    cmd.setAttribute('auto-discover', '');
    document.body.appendChild(cmd);
  }
  if (!document.querySelector('oz-inspector')) {
    document.body.appendChild(document.createElement('oz-inspector'));
  }
  if (!document.querySelector('oz-cookie-consent')) {
    document.body.appendChild(document.createElement('oz-cookie-consent'));
  }

  // Shared Connected Footer
  if (showFooter && !document.querySelector('.oz-site-foot-wrap')) {
    const fw = document.createElement('div');
    fw.className = 'oz-container oz-site-foot-wrap';
    fw.style.paddingBottom = '36px';
    fw.innerHTML = `<oz-footer variant="multi-col" brand="OzoneUI" tagline="Web Standards, AI-Native, Zero-Build &amp; EU/GDPR Ready UI Framework." columns='[{"title":"Explore","links":[{"label":"Home","href":"index.html"},{"label":"Live Template Demo","href":"demo.html"},{"label":"66 Components","href":"components.html"},{"label":"AI & Brand Studio","href":"ai.html"}]},{"title":"Resources & Trust","links":[{"label":"Help & Wiki","href":"wiki.html"},{"label":"EU Impressum & GDPR","href":"legal.html"},{"label":"llms.txt (AI Prompt)","href":"llms.txt"},{"label":"llms-full.txt","href":"llms-full.txt"}]},{"title":"Ecosystem","links":[{"label":"GitHub Repo","href":"https://github.com/valldy31/ozoneui"},{"label":"VS Code Custom Data","href":"vscode.html-custom-data.json"},{"label":"TypeScript Types","href":"dist/ozone.d.ts"},{"label":"sitemap.xml","href":"sitemap.xml"}]}]' copyright="© 2026 N Studios (ozoneui.nstudios.eu) • MIT License • Zero Tracking Cookies"></oz-footer>`;
    document.body.appendChild(fw);
  }

  // Wire Controls Popover & Navigation
  const ccBtn = document.getElementById('btn-control-center');
  const ccPop = document.getElementById('studio-cc-popover');
  const setPop = (open) => {
    ccPop.setAttribute('data-open', String(open));
    ccBtn.setAttribute('aria-expanded', String(open));
  };
  const setMob = (open) => {
    hdr.setAttribute('data-mobile-open', String(open));
    backdrop.dataset.open = String(open && hdr.getAttribute('data-mobile-style') !== 'dropdown');
    document.getElementById('btn-mobile-menu')?.setAttribute('aria-expanded', String(open));
  };

  ccBtn.addEventListener('click', (e) => { e.stopPropagation(); setMob(false); setPop(ccPop.getAttribute('data-open') !== 'true'); Ozone.sound.click(); });
  document.getElementById('btn-cc-close').addEventListener('click', () => setPop(false));
  document.getElementById('btn-cmd-k').addEventListener('click', () => { setPop(false); document.querySelector('oz-command')?.open(); });
  document.getElementById('btn-mobile-menu').addEventListener('click', () => { setPop(false); setMob(hdr.getAttribute('data-mobile-open') !== 'true'); });
  document.getElementById('btn-st-drawer-close').addEventListener('click', () => setMob(false));
  backdrop.addEventListener('click', () => setMob(false));
  document.addEventListener('pointerdown', (e) => { if (ccPop.getAttribute('data-open') === 'true' && !ccPop.contains(e.target) && !ccBtn.contains(e.target)) setPop(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setPop(false); setMob(false); } });

  document.querySelectorAll('[data-mobile-style-set]').forEach((b) => b.addEventListener('click', () => {
    hdr.setAttribute('data-mobile-style', b.dataset.mobileStyleSet);
    document.querySelectorAll('[data-mobile-style-set]').forEach((x) => {
      x.className = `oz-btn oz-btn--sm ${x === b ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });
  }));

  const syncLabels = () => {
    const d = Ozone.dna.read();
    const isLight = d.theme === 'light';
    const isPrec = d.mode === 'precision';
    const isVeil = document.documentElement.dataset.ozPrivacy === 'true';
    const tEl = document.getElementById('sh-theme-lbl'); if (tEl) tEl.textContent = isLight ? 'Light Mode' : 'Dark Mode';
    const mEl = document.getElementById('sh-mode-lbl'); if (mEl) mEl.textContent = isPrec ? 'Precision 1px' : 'Atmospheric';
    const vEl = document.getElementById('sh-veil-lbl'); if (vEl) vEl.textContent = isVeil ? 'Veil: On' : 'Veil: Off';
    const sEl = document.getElementById('sh-sound-lbl'); if (sEl) sEl.textContent = d.sound ? 'FX: On' : 'FX: Off';
    const dot = document.getElementById('cc-active-dot'); if (dot) dot.dataset.veil = String(isVeil);
    const pLbl = document.getElementById('cc-preset-label'); if (pLbl) pLbl.textContent = Ozone.dna.presets[d.preset]?.label || d.preset;
    document.querySelectorAll('[data-cc-preset]').forEach((b) => { b.dataset.active = String(b.dataset.ccPreset === d.preset); });
  };

  hdr.addEventListener('click', (e) => {
    const act = e.target.closest('[data-sh-act]')?.dataset.shAct;
    if (!act) return;
    Ozone.sound.click();
    if (act === 'theme') { Ozone.setTheme(Ozone.dna.read().theme === 'dark' ? 'light' : 'dark'); savePrefs(); }
    else if (act === 'mode') { Ozone.setMode(Ozone.dna.read().mode === 'atmospheric' ? 'precision' : 'atmospheric'); savePrefs(); }
    else if (act === 'dna') { setPop(false); setMob(false); document.querySelector('oz-inspector')?.toggle(); }
    else if (act === 'copilot') { setPop(false); setMob(false); Ozone.agent.runDemoWorkflow(); }
    else if (act === 'veil') { Ozone.setPrivacyMode(document.documentElement.dataset.ozPrivacy !== 'true'); savePrefs(); }
    else if (act === 'sound') { Ozone.setSound(!Ozone.dna.read().sound); savePrefs(); }
    else if (act === 'gdpr') { setPop(false); setMob(false); document.querySelector('oz-cookie-consent')?.open(); }
    syncLabels();
  });

  document.querySelectorAll('[data-cc-preset]').forEach((btn) => btn.addEventListener('click', () => {
    Ozone.dna.applyPreset(btn.dataset.ccPreset);
    savePrefs({ preset: btn.dataset.ccPreset });
    syncLabels();
  }));
  document.getElementById('cc-hex-picker')?.addEventListener('input', (e) => {
    Ozone.dna.fromHex(e.target.value, 'analogous');
    savePrefs({ preset: 'custom' });
    syncLabels();
  });
  window.addEventListener('oz-dna-change', syncLabels);
  syncLabels();

  window.OzoneShell = { openControls: () => setPop(true), closeControls: () => setPop(false), toggleInspector: () => document.querySelector('oz-inspector')?.toggle() };
}
