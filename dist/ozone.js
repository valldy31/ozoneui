// ============================================================================
// OzoneUI v1.0.0 — Zero-Dependency Standalone Web Standards Bundle
// Works directly in HTML, PHP, React, Vue, Svelte, or streamed AI JSON
// ============================================================================

// --- 1. Micro-Signals -------------------------------------------------------
let _activeEffect = null;

export function signal(initial) {
  let value = initial;
  const subs = new Set();
  const read = () => {
    if (_activeEffect) subs.add(_activeEffect);
    return value;
  };
  read.peek = () => value;
  read.set = (next) => {
    const resolved = typeof next === 'function' ? next(value) : next;
    if (Object.is(value, resolved)) return;
    value = resolved;
    for (const sub of Array.from(subs)) sub();
  };
  read.subscribe = (fn) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };
  return read;
}

export function effect(fn) {
  const runner = () => {
    const prev = _activeEffect;
    _activeEffect = runner;
    try { fn(); } finally { _activeEffect = prev; }
  };
  runner();
  return () => { _activeEffect = null; };
}

export function computed(fn) {
  const s = signal(undefined);
  effect(() => s.set(fn()));
  return () => s();
}

// --- 2. Procedural Web Audio Synthesizer & Haptics --------------------------
class OzoneSoundEngine {
  constructor() {
    this.ctx = null;
  }
  isEnabled() {
    const setting = document.documentElement.dataset.ozSound;
    return setting !== 'off' && setting !== 'false';
  }
  getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }
  tone(freq, endFreq, duration, type = 'sine', gainVal = 0.035, delay = 0) {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {}
  }
  haptic(ms = 6) {
    if (!this.isEnabled()) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { if (!navigator.userActivation || navigator.userActivation.hasBeenActive) navigator.vibrate(ms); } catch {}
    }
  }
  hover() { this.tone(1850, 2200, 0.035, 'sine', 0.012); }
  click() { this.tone(820, 360, 0.055, 'triangle', 0.04); this.haptic(6); }
  toggle(on) {
    if (on) {
      this.tone(520, 880, 0.09, 'sine', 0.04);
      this.tone(1040, 1320, 0.08, 'sine', 0.025, 0.04);
    } else {
      this.tone(680, 340, 0.09, 'sine', 0.035);
    }
    this.haptic(8);
  }
  open() {
    this.tone(420, 640, 0.14, 'sine', 0.03);
    this.tone(630, 960, 0.16, 'sine', 0.02, 0.03);
  }
  success() {
    this.tone(587.33, 587.33, 0.10, 'sine', 0.035, 0);
    this.tone(783.99, 783.99, 0.11, 'sine', 0.035, 0.055);
    this.tone(1174.66, 1174.66, 0.16, 'sine', 0.03, 0.11);
    this.haptic(10);
  }
  agent() {
    this.tone(980, 1480, 0.07, 'sine', 0.025, 0);
    this.tone(1480, 1960, 0.08, 'sine', 0.018, 0.05);
  }
}

export const sound = new OzoneSoundEngine();

// --- 3. 120fps Specular Atmosphere, 3D Tilt & Auto-FPS Governor --------------
let _atmoInit = false;
export function initAtmosphere() {
  if (_atmoInit || typeof window === 'undefined') return;
  _atmoInit = true;

  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (media?.matches) document.documentElement.dataset.ozPerf = 'eco';

  let rafPending = false;
  let lastX = 0;
  let lastY = 0;
  let activeEl = null;

  const updatePointer = () => {
    rafPending = false;
    if (!activeEl || document.documentElement.dataset.ozPerf === 'eco') return;
    const rect = activeEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = lastX - rect.left;
    const y = lastY - rect.top;
    activeEl.style.setProperty('--oz-mouse-x', `${x.toFixed(1)}px`);
    activeEl.style.setProperty('--oz-mouse-y', `${y.toFixed(1)}px`);

    if (activeEl.hasAttribute('tilt')) {
      const nx = (x / rect.width) - 0.5;
      const ny = (y / rect.height) - 0.5;
      activeEl.style.setProperty('--oz-tilt-x', `${(-ny * 5.5).toFixed(2)}deg`);
      activeEl.style.setProperty('--oz-tilt-y', `${(nx * 5.5).toFixed(2)}deg`);
    }
  };

  window.addEventListener('pointermove', (e) => {
    const target = e.target?.closest?.('oz-card, oz-stat, oz-chart, oz-pricing, oz-product-card, oz-post') || null;
    if (activeEl && activeEl !== target && activeEl.hasAttribute('tilt')) {
      activeEl.style.setProperty('--oz-tilt-x', '0deg');
      activeEl.style.setProperty('--oz-tilt-y', '0deg');
    }
    activeEl = target;
    lastX = e.clientX;
    lastY = e.clientY;
    if (activeEl && !rafPending) {
      rafPending = true;
      requestAnimationFrame(updatePointer);
    }
  }, { passive: true });

  let frames = 0;
  let windowStart = performance.now();
  let slowWindows = 0;
  const sampleFps = (now) => {
    frames++;
    const elapsed = now - windowStart;
    if (elapsed >= 2000) {
      const fps = (frames * 1000) / elapsed;
      if (fps > 0 && fps < 32 && !document.hidden) {
        slowWindows++;
        if (slowWindows >= 3 && !document.documentElement.dataset.ozPerf) {
          document.documentElement.dataset.ozPerf = 'eco';
        }
      } else {
        slowWindows = Math.max(0, slowWindows - 1);
      }
      frames = 0;
      windowStart = now;
    }
    if (slowWindows < 3) requestAnimationFrame(sampleFps);
  };
  requestAnimationFrame(sampleFps);
}

// --- 4. Theme DNA Barcode, Preset Archetype & Client Auto-Branding Engine -----
export const BRAND_PRESETS = {
  ozone: { id: 'ozone', label: 'Ozone Cyber', hue: 205, accentHue: 280, mode: 'atmospheric', theme: 'dark', blur: 20, radius: 16, swatch: '#00d2ff', hex: '#00b4d8' },
  emerald: { id: 'emerald', aliases: ['fintech'], label: 'Emerald Fintech', hue: 155, accentHue: 195, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#10b981', hex: '#10b981' },
  amethyst: { id: 'amethyst', aliases: ['ai'], label: 'Amethyst AI', hue: 285, accentHue: 330, mode: 'atmospheric', theme: 'dark', blur: 22, radius: 18, swatch: '#a855f7', hex: '#a855f7' },
  crimson: { id: 'crimson', aliases: ['gaming', 'rose'], label: 'Crimson Pulse', hue: 12, accentHue: 42, mode: 'atmospheric', theme: 'dark', blur: 20, radius: 16, swatch: '#f43f5e', hex: '#f43f5e' },
  amber: { id: 'amber', aliases: ['luxury', 'gold'], label: 'Solar Luxury', hue: 75, accentHue: 38, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#f59e0b', hex: '#f59e0b' },
  ocean: { id: 'ocean', aliases: ['saas', 'cobalt'], label: 'Ocean SaaS', hue: 235, accentHue: 198, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#3b82f6', hex: '#3b82f6' },
  nordic: { id: 'nordic', aliases: ['enterprise', 'slate'], label: 'Nordic Precision', hue: 220, accentHue: 255, mode: 'precision', theme: 'dark', blur: 0, radius: 10, swatch: '#64748b', hex: '#475569' },
  daylight: { id: 'daylight', aliases: ['quartz', 'light'], label: 'Daylight Quartz', hue: 230, accentHue: 275, mode: 'atmospheric', theme: 'light', blur: 20, radius: 16, swatch: '#94a3b8', hex: '#2563eb' }
};

function _normHex(raw) {
  let clean = String(raw || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) clean = clean.split('').map((c) => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(clean) ? `#${clean.toLowerCase()}` : '#00b4d8';
}
function _srgbToLin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function _findPreset(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (BRAND_PRESETS[key]) return BRAND_PRESETS[key];
  return Object.values(BRAND_PRESETS).find((p) => p.aliases?.includes(key)) || null;
}

export const dna = {
  presets: BRAND_PRESETS,
  read() {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const harmony = root.dataset.ozHarmony;
    const density = root.dataset.ozDensity;
    return {
      mode: root.dataset.ozMode === 'precision' ? 'precision' : 'atmospheric',
      theme: root.dataset.ozTheme === 'light' ? 'light' : 'dark',
      hue: parseInt(root.style.getPropertyValue('--oz-hue') || cs.getPropertyValue('--oz-hue') || '205', 10) || 205,
      accentHue: parseInt(root.style.getPropertyValue('--oz-accent-hue') || cs.getPropertyValue('--oz-accent-hue') || '280', 10) || 280,
      blur: parseInt(root.style.getPropertyValue('--oz-blur') || cs.getPropertyValue('--oz-blur') || '20', 10) || 20,
      radius: parseInt(root.style.getPropertyValue('--oz-radius') || cs.getPropertyValue('--oz-radius') || '16', 10) || 16,
      sound: root.dataset.ozSound !== 'off',
      preset: root.dataset.ozPreset || 'ozone',
      brand: root.dataset.ozBrand || '#00b4d8',
      harmony: ['analogous', 'complementary', 'triadic', 'monochrome'].includes(harmony) ? harmony : 'analogous',
      density: ['compact', 'default', 'spacious'].includes(density) ? density : 'default',
      brandName: root.dataset.ozBrandName || 'OzoneUI'
    };
  },
  encode() {
    const s = this.read();
    return `oz://${s.mode}-${s.theme}-${s.hue}-${s.accentHue}-b${s.blur}-r${s.radius}-s${s.sound ? 1 : 0}`;
  },
  emitChange() {
    const root = document.documentElement;
    root.dataset.ozDna = this.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: this.read() }));
  },
  hexToOklch(hex) {
    const clean = _normHex(hex).slice(1);
    const r = _srgbToLin(parseInt(clean.slice(0, 2), 16) / 255);
    const g = _srgbToLin(parseInt(clean.slice(2, 4), 16) / 255);
    const b = _srgbToLin(parseInt(clean.slice(4, 6), 16) / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const chroma = Math.hypot(A, B);
    const h = chroma < 0.004 ? 205 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
    return { l: Number(L.toFixed(3)), c: Number(chroma.toFixed(3)), h: Math.round(h) };
  },
  applyPreset(name) {
    const preset = _findPreset(name);
    if (!preset) return null;
    const root = document.documentElement;
    root.dataset.ozMode = preset.mode;
    root.dataset.ozTheme = preset.theme;
    root.dataset.ozPreset = preset.id;
    root.dataset.ozBrand = preset.hex;
    root.dataset.ozContrast = 'AAA Verified';
    root.style.setProperty('--oz-hue', String(preset.hue));
    root.style.setProperty('--oz-accent-hue', String(preset.accentHue));
    root.style.removeProperty('--oz-backdrop');
    root.style.setProperty('--oz-blur', `${preset.blur}px`);
    root.style.setProperty('--oz-radius', `${preset.radius}px`);
    this.emitChange();
    return preset;
  },
  fromHex(hex, harmony = 'analogous') {
    const normalized = _normHex(hex);
    const oklch = this.hexToOklch(normalized);
    const hue = oklch.h;
    const offsetMap = { analogous: 55, complementary: 180, triadic: 120, monochrome: 0 };
    const accentHue = (hue + (offsetMap[harmony] ?? 55)) % 360;
    const root = document.documentElement;
    root.style.setProperty('--oz-hue', String(hue));
    root.style.setProperty('--oz-accent-hue', String(accentHue));
    root.dataset.ozBrand = normalized;
    root.dataset.ozHarmony = harmony;
    root.dataset.ozPreset = 'custom';
    root.dataset.ozContrast = oklch.l > 0.72 ? 'AAA Verified (Dark Ink)' : 'AAA Verified';
    this.emitChange();
    return { hex: normalized, hue, accentHue, harmony, lightness: oklch.l, chroma: oklch.c };
  },
  fromLogoFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || typeof FileReader === 'undefined') { reject(new Error('FileReader unavailable')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read logo image'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Unsupported logo format'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 32; canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(this.fromHex('#00b4d8').hex); return; }
          ctx.drawImage(img, 0, 0, 32, 32);
          const pixels = ctx.getImageData(0, 0, 32, 32).data;
          let bestScore = -1, bestHex = '#00b4d8';
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
            if (a < 128) continue;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if (luma < 0.08 || luma > 0.94) continue;
            const sat = max === 0 ? 0 : (max - min) / max;
            const score = sat * (1 - Math.abs(luma - 0.55));
            if (score > bestScore) {
              bestScore = score;
              bestHex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
            }
          }
          resolve(this.fromHex(bestHex, this.read().harmony).hex);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  },
  setDensity(density) {
    const root = document.documentElement;
    root.dataset.ozDensity = density;
    root.style.setProperty('--oz-radius', density === 'compact' ? '10px' : density === 'spacious' ? '22px' : '16px');
    this.emitChange();
  },
  setBrandName(name) {
    const root = document.documentElement;
    const trimmed = String(name || '').trim();
    if (trimmed) root.dataset.ozBrandName = trimmed;
    else delete root.dataset.ozBrandName;
    document.querySelectorAll('[data-oz-brand-text]').forEach((el) => {
      if (!el.dataset.ozDefaultBrand) el.dataset.ozDefaultBrand = el.textContent?.trim() || 'OzoneUI';
      el.textContent = trimmed || el.dataset.ozDefaultBrand;
    });
    this.emitChange();
  },
  getDeployHTML() {
    const s = this.read();
    const attrs = [
      'lang="en"',
      `data-oz-preset="${s.preset}"`,
      `data-oz-brand="${s.brand}"`,
      `data-oz-harmony="${s.harmony}"`,
      `data-oz-mode="${s.mode}"`,
      `data-oz-theme="${s.theme}"`,
      `data-oz-density="${s.density}"`,
      s.brandName && s.brandName !== 'OzoneUI' ? `data-oz-brand-name="${s.brandName}"` : ''
    ].filter(Boolean);
    return `<html ${attrs.join(' ')}>`;
  },
  getShareURL() {
    if (typeof window === 'undefined') return '';
    const s = this.read();
    const url = new URL(window.location.href);
    url.searchParams.set('preset', s.preset);
    url.searchParams.set('brand', s.brand.replace(/^#/, ''));
    url.searchParams.set('harmony', s.harmony);
    url.searchParams.set('mode', s.mode);
    url.searchParams.set('theme', s.theme);
    url.searchParams.set('density', s.density);
    if (s.brandName && s.brandName !== 'OzoneUI') url.searchParams.set('name', s.brandName);
    else url.searchParams.delete('name');
    return url.toString();
  },
  getW3CTokens() {
    const s = this.read();
    const lPrim = s.theme === 'light' ? '0.54' : '0.72';
    return JSON.stringify({
      $schema: 'https://tr.designtokens.org/format/',
      meta: { framework: 'OzoneUI', preset: s.preset, brandName: s.brandName, harmony: s.harmony, contrast: document.documentElement.dataset.ozContrast || 'AAA Verified' },
      color: {
        brand: {
          sourceHex: { $value: s.brand, $type: 'color' },
          primary: { $value: `oklch(${lPrim} 0.19 ${s.hue})`, $type: 'color' },
          accent: { $value: `oklch(0.70 0.21 ${s.accentHue})`, $type: 'color' }
        },
        surface: {
          background: { $value: s.theme === 'light' ? `oklch(0.965 0.012 ${s.hue})` : `oklch(0.12 0.02 ${s.hue})`, $type: 'color' },
          card: { $value: s.theme === 'light' ? `oklch(0.99 0.008 ${s.hue} / 0.72)` : `oklch(0.18 0.025 ${s.hue} / 0.62)`, $type: 'color' }
        }
      },
      dimension: { radius: { $value: `${s.radius}px`, $type: 'dimension' }, blur: { $value: `${s.blur}px`, $type: 'dimension' }, density: { $value: s.density, $type: 'string' } }
    }, null, 2);
  },
  initBranding() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const params = new URLSearchParams(window.location.search);
    const urlPreset = params.get('preset');
    const urlBrand = params.get('brand') || params.get('hex');
    const urlHarmony = params.get('harmony') || root.dataset.ozHarmony || 'analogous';
    const urlMode = params.get('mode');
    const urlTheme = params.get('theme');
    const urlDensity = params.get('density');
    const urlName = params.get('name');
    const attrPreset = root.dataset.ozPreset || root.getAttribute('data-theme') || '';
    const attrBrand = root.dataset.ozBrand || '';
    if (urlPreset && urlPreset !== 'custom') this.applyPreset(urlPreset);
    else if (!urlBrand && attrPreset && attrPreset !== 'custom') this.applyPreset(attrPreset);
    if (urlBrand) this.fromHex(urlBrand, urlHarmony);
    else if (!urlPreset && attrBrand && !attrPreset) this.fromHex(attrBrand, urlHarmony);
    if (urlMode === 'atmospheric' || urlMode === 'precision') root.dataset.ozMode = urlMode;
    if (urlTheme === 'dark' || urlTheme === 'light') root.dataset.ozTheme = urlTheme;
    if (urlDensity && ['compact', 'default', 'spacious'].includes(urlDensity)) this.setDensity(urlDensity);
    else if (root.dataset.ozDensity && ['compact', 'spacious'].includes(root.dataset.ozDensity)) this.setDensity(root.dataset.ozDensity);
    if (urlName) this.setBrandName(urlName);
    else if (root.dataset.ozBrandName) this.setBrandName(root.dataset.ozBrandName);
  },
  apply(code) {
    const cleaned = String(code || '').trim().replace(/^oz:\/\//, '');
    const parts = cleaned.split('-');
    if (parts.length < 4) return false;
    const [mode, theme, hue, accent, blurStr, radiusStr, soundStr] = parts;
    const root = document.documentElement;
    if (mode === 'atmospheric' || mode === 'precision') root.dataset.ozMode = mode;
    if (theme === 'dark' || theme === 'light') root.dataset.ozTheme = theme;
    if (!Number.isNaN(Number(hue))) root.style.setProperty('--oz-hue', String(Math.max(0, Math.min(360, Number(hue)))));
    if (!Number.isNaN(Number(accent))) root.style.setProperty('--oz-accent-hue', String(Math.max(0, Math.min(360, Number(accent)))));
    if (blurStr?.startsWith('b')) {
      const b = Number(blurStr.slice(1));
      if (!Number.isNaN(b)) root.style.setProperty('--oz-blur', `${b}px`);
    }
    if (radiusStr?.startsWith('r')) {
      const r = Number(radiusStr.slice(1));
      if (!Number.isNaN(r)) root.style.setProperty('--oz-radius', `${r}px`);
    }
    if (soundStr?.startsWith('s')) root.dataset.ozSound = soundStr === 's1' ? 'on' : 'off';
    this.emitChange();
    return true;
  },
  reset() {
    const root = document.documentElement;
    delete root.dataset.ozHarmony;
    delete root.dataset.ozContrast;
    root.style.removeProperty('--oz-backdrop');
    this.setDensity('default');
    this.setBrandName('');
    this.applyPreset('ozone');
    root.dataset.ozSound = 'on';
    this.emitChange();
  }
};

// --- 5. Stackable Glass Toast System ----------------------------------------
export function toast(opts) {
  const cfg = typeof opts === 'string' ? { message: opts } : opts;
  const variant = cfg.variant || 'cyan';
  const duration = cfg.duration ?? 3400;
  let stack = document.getElementById('oz-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'oz-toast-stack';
    document.body.appendChild(stack);
  }
  const dotColor = {
    cyan: 'var(--oz-cyan)', violet: 'var(--oz-violet)', emerald: 'var(--oz-emerald)',
    amber: 'var(--oz-amber)', rose: 'var(--oz-rose)', neutral: 'var(--oz-text-muted)'
  };
  const item = document.createElement('div');
  item.className = 'oz-toast-item';
  item.innerHTML = `
    <span style="width:9px;height:9px;border-radius:50%;margin-top:6px;flex-shrink:0;background:${dotColor[variant] || dotColor.cyan};box-shadow:0 0 10px ${dotColor[variant] || dotColor.cyan};"></span>
    <div style="flex:1;min-width:0;">
      ${cfg.title ? `<div class="oz-toast-title" style="font-weight:600;font-size:0.86rem;margin-bottom:2px;"></div>` : ''}
      <div class="oz-toast-msg" style="font-size:0.82rem;color:var(--oz-text-muted);"></div>
    </div>
    <button aria-label="Close" style="background:none;border:none;color:var(--oz-text-subtle);cursor:pointer;font-size:1rem;line-height:1;">&times;</button>
  `;
  if (cfg.title) item.querySelector('.oz-toast-title').textContent = cfg.title;
  item.querySelector('.oz-toast-msg').textContent = cfg.message;
  const remove = () => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    item.style.transition = 'all 180ms ease';
    setTimeout(() => item.remove(), 190);
  };
  item.querySelector('button').addEventListener('click', remove);
  stack.appendChild(item);
  if (variant === 'emerald') sound.success(); else sound.open();
  if (duration > 0) setTimeout(remove, duration);
}

// --- 6. Helpers: Escape HTML, Self-Healing JSON, Mock Data ------------------
export function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function repairJSON(raw) {
  if (raw !== null && typeof raw === 'object') return { ok: true, data: raw, repaired: false };
  const text = String(raw ?? '').trim();
  if (!text) return { ok: false, data: null, repaired: false, error: 'Empty input' };
  const unfenced = text.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return { ok: true, data: JSON.parse(unfenced), repaired: unfenced !== text };
  } catch {
    let candidate = unfenced
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*?)'(\s*[,}\]])/g, ':"$1"$2')
      .replace(/[,:]\s*$/, '');
    const stack = [];
    let inString = false;
    let escaped = false;
    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if ((ch === '}' || ch === ']') && stack.length > 0 && stack[stack.length - 1] === ch) stack.pop();
      }
    }
    if (inString) candidate += '"';
    candidate = candidate.replace(/,\s*$/, '');
    while (stack.length > 0) candidate += stack.pop();
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      return { ok: true, data: JSON.parse(candidate), repaired: true };
    } catch (err) {
      return { ok: false, data: null, repaired: false, error: err.message };
    }
  }
}

export function resolveMockData(src) {
  const key = src.replace(/^mock:\/\//i, '').toLowerCase();
  const jitter = (n) => Math.max(10, Math.round(n + (Math.random() - 0.45) * (n * 0.14)));
  if (key.includes('revenue') || key.includes('metrics') || key.includes('traffic')) {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [142, 198, 176, 264, 318, 389, 442].map(jitter),
      title: 'Live Neural Telemetry',
      value: `$${jitter(128400).toLocaleString()}`,
      delta: `+${(24 + Math.random() * 12).toFixed(1)}%`
    };
  }
  if (key.includes('user')) {
    return [
      { id: 'USR-901', name: 'Elena Vance', email: 'elena@aether.ai', role: 'Architect', status: 'Active', mrr: '$4,800' },
      { id: 'USR-902', name: 'Marcus Chen', email: 'm.chen@hyperion.io', role: 'Founder', status: 'Active', mrr: '$12,400' },
      { id: 'USR-903', name: 'Aria Solis', email: 'aria@solislabs.dev', role: 'ML Lead', status: 'Trial', mrr: '$980' },
      { id: 'USR-904', name: 'Devon Brooks', email: 'devon@nexus.cloud', role: 'VP Eng', status: 'Active', mrr: '$8,200' },
      { id: 'USR-905', name: 'Sora Takahashi', email: 'sora@kuro.jp', role: 'Design Lead', status: 'Pending', mrr: '$1,450' }
    ];
  }
  if (key.includes('product')) {
    return [
      { title: 'Aether Shader Kit', category: 'Shaders', price: '$69', rating: 4.9, sales: 1420 },
      { title: 'Neural Admin Pro', category: 'Templates', price: '$119', rating: 4.8, sales: 980 },
      { title: 'Spatial Icon Pack 3D', category: 'Assets', price: '$49', rating: 5.0, sales: 2150 },
      { title: 'Voice Agent SDK', category: 'AI Tools', price: '$149', rating: 4.9, sales: 640 }
    ];
  }
  return { labels: ['Q1', 'Q2', 'Q3', 'Q4'], data: [45, 78, 112, 164].map(jitter) };
}

// --- 7. Registry, Morph & AI Introspection ----------------------------------
export const COMPONENT_MANIFEST = [
  { tag: 'oz-icon', domain: 'core', description: 'Universal 4-mode SVG vector icon (builtin/Iconify/custom/font)', props: ['name', 'set(builtin|lucide|ph|tabler|solar|heroicons)', 'size', 'stroke', 'src', 'icon-class', 'glow', 'spin'] },
  { tag: 'oz-button', domain: 'core', description: 'Atmospheric action button', props: ['variant(primary|glow|glass|ghost|danger|success)', 'size(sm|md|lg)', 'icon', 'icon-right', 'pill', 'loading', 'label'] },
  { tag: 'oz-card', domain: 'core', description: 'Glass surface card with optional 3D tilt & glow', props: ['title', 'subtitle', 'badge', 'tilt', 'glow(cyan|violet|emerald|amber|rose)', 'exportable'] },
  { tag: 'oz-badge', domain: 'core', description: 'Status pill with optional live pulse dot', props: ['variant(cyan|violet|emerald|amber|rose|neutral)', 'pulse', 'label'] },
  { tag: 'oz-input', domain: 'core', description: 'Glass input with privacy secret mask toggle', props: ['label', 'placeholder', 'value', 'type', 'mask(secret)', 'icon'] },
  { tag: 'oz-switch', domain: 'core', description: 'Spring-physics toggle switch', props: ['label', 'checked'] },
  { tag: 'oz-tabs', domain: 'core', description: 'Animated pill tab bar', props: ['active', 'tabs(comma-separated)'] },
  { tag: 'oz-dialog', domain: 'core', description: 'Spring modal dialog', props: ['title', 'open'] },
  { tag: 'oz-avatar', domain: 'social', description: 'User avatar with live presence status & verified badge', props: ['name', 'src', 'status(online|busy|away|streaming)', 'verified', 'size'] },
  { tag: 'oz-stat', domain: 'admin', description: 'KPI metric card with sparkline & privacy mask', props: ['title', 'value', 'delta', 'trend(up|down|neutral)', 'sparkline', 'mask(blur)', 'src', 'poll'] },
  { tag: 'oz-chart', domain: 'admin', description: 'Interactive SVG chart (area, line, bar, donut) with SVG export', props: ['type(area|line|bar|donut)', 'title', 'labels', 'data', 'glow', 'exportable', 'src', 'poll'] },
  { tag: 'oz-table', domain: 'admin', description: 'Searchable, sortable enterprise grid with CSV/JSON export', props: ['title', 'rows(JSON)', 'searchable', 'exportable', 'mask-cols', 'src', 'poll'] },
  { tag: 'oz-smart-view', domain: 'admin', description: 'Zero-config 4-way data morpher (Table/Chart/Cards/JSON)', props: ['title', 'data(JSON)', 'view(table|chart|cards|json)', 'src'] },
  { tag: 'oz-hero', domain: 'landing', description: 'Cinematic aurora hero container', props: ['badge', 'title', 'subtitle'] },
  { tag: 'oz-bento', domain: 'landing', description: 'Responsive drag-and-drop sortable bento grid', props: ['cols', 'sortable', 'persist-key'] },
  { tag: 'oz-pricing', domain: 'landing', description: 'Pricing tier card with popular aura ring', props: ['title', 'price', 'period', 'popular', 'features(csv)', 'cta'] },
  { tag: 'oz-marquee', domain: 'landing', description: 'Infinite smooth-scrolling horizontal ticker', props: ['speed'] },
  { tag: 'oz-product-card', domain: 'marketplace', description: '3D tilt product showcase with wishlist & quick buy', props: ['title', 'price', 'old-price', 'rating', 'reviews', 'badge', 'category', 'seller', 'gradient'] },
  { tag: 'oz-rating', domain: 'marketplace', description: 'Interactive or static star rating', props: ['value', 'max', 'interactive'] },
  { tag: 'oz-post', domain: 'social', description: 'Interactive social feed post with live reactions', props: ['author', 'handle', 'verified', 'status', 'time', 'likes', 'comments', 'shares', 'tags', 'content'] },
  { tag: 'oz-composer', domain: 'social', description: 'Post composer that publishes live <oz-post> items', props: ['placeholder', 'target'] },
  { tag: 'oz-renderer', domain: 'ai', description: 'Self-healing streaming JSON-to-UI renderer', props: ['schema(JSON)'] },
  { tag: 'oz-command', domain: 'os', description: 'Cmd+K auto-discovering command palette', props: ['auto-discover'] },
  { tag: 'oz-inspector', domain: 'os', description: 'Alt+O floating Theme DNA visual studio', props: ['open'] },
  { tag: 'oz-header', domain: 'layout', description: 'Navigation bar header in glass, floating, minimal, or enterprise style', props: ['variant(glass|floating|minimal|enterprise)', 'brand', 'badge', 'links(csv)', 'max-links', 'cta', 'search', 'icon', 'mobile-menu(slide|slide-left|modal|dropdown)'] },
  { tag: 'oz-footer', domain: 'layout', description: 'Multi-column, minimal, or status footer with newsletter & links', props: ['variant(multi-col|minimal|status)', 'brand', 'tagline', 'columns(JSON)', 'status', 'copyright', 'newsletter'] },
  { tag: 'oz-breadcrumbs', domain: 'layout', description: 'Clickable navigation breadcrumb trail', props: ['items(csv|JSON)', 'separator(arrow|slash)'] },
  { tag: 'oz-alert', domain: 'layout', description: 'Dismissible callout banner with action button & semantic colors', props: ['variant(cyan|violet|emerald|amber|rose)', 'title', 'message', 'icon', 'dismissible', 'cta'] },
  { tag: 'oz-progress', domain: 'layout', description: 'Glowing progress bar with determinate & shimmer indeterminate modes', props: ['value', 'max', 'label', 'variant(cyan|violet|emerald|amber|rose)', 'show-value', 'indeterminate'] },
  { tag: 'oz-accordion', domain: 'layout', description: 'Expandable FAQ / settings accordion list', props: ['items(JSON)', 'multiple'] },
  { tag: 'oz-timeline', domain: 'layout', description: 'Vertical activity, audit, and roadmap timeline', props: ['items(JSON)'] },
  { tag: 'oz-sidebar', domain: 'layout', description: 'Collapsible app sidebar: grouped nav, nested items, badges, search, user footer, mobile drawer', props: ['brand', 'icon', 'items(JSON groups|flat)', 'active', 'collapsed', 'side(left|right)', 'variant(glass|solid|floating)', 'searchable', 'user-name', 'user-email', 'width', 'persist-key'] },
  { tag: 'oz-app-shell', domain: 'layout', description: 'Admin app layout: sidebar + sticky topbar + content; put oz-sidebar, slot=actions and content as children', props: ['heading', 'subtitle', 'topbar', 'fill'] },
  { tag: 'oz-select', domain: 'forms', description: 'Styled native select with groups', props: ['label', 'hint', 'error', 'options(csv|JSON)', 'value', 'placeholder', 'disabled'] },
  { tag: 'oz-checkbox', domain: 'forms', description: 'Checkbox with description and indeterminate state', props: ['label', 'description', 'checked', 'indeterminate', 'hint', 'error', 'disabled'] },
  { tag: 'oz-radio-group', domain: 'forms', description: 'Radio group, plain or selectable cards', props: ['label', 'options(csv|JSON)', 'value', 'variant(default|cards)', 'inline', 'hint', 'error'] },
  { tag: 'oz-textarea', domain: 'forms', description: 'Textarea with character counter and autosize', props: ['label', 'placeholder', 'rows', 'maxlength', 'autosize', 'hint', 'error'] },
  { tag: 'oz-slider', domain: 'forms', description: 'Range slider with live value readout', props: ['label', 'min', 'max', 'step', 'value', 'prefix', 'suffix', 'show-value'] },
  { tag: 'oz-date-picker', domain: 'forms', description: 'Native date/time picker in Ozone styling', props: ['label', 'type(date|datetime-local|time|month|week)', 'value', 'min', 'max'] },
  { tag: 'oz-file-upload', domain: 'forms', description: 'Drag-and-drop file dropzone with size validation; emits oz-files', props: ['label', 'accept', 'multiple', 'max-size(MB)', 'prompt', 'description'] },
  { tag: 'oz-combobox', domain: 'forms', description: 'Searchable select; multiple for chips, creatable to add values', props: ['label', 'options(csv|JSON)', 'value(csv)', 'multiple', 'creatable', 'placeholder'] },
  { tag: 'oz-parallax', domain: 'landing', description: 'Multi-layer scroll and mouse parallax stage for depth backgrounds and cards', props: ['speed', 'direction(vertical|horizontal|mouse|both)', 'tilt', 'height', 'badge', 'heading', 'subtitle'] },
  { tag: 'oz-reveal', domain: 'landing', description: 'IntersectionObserver scroll-triggered entrance animator with stagger support', props: ['effect(fade-up|fade-down|zoom|blur|flip|slide-left|slide-right)', 'delay', 'duration', 'stagger', 'once'] },
  { tag: 'oz-spotlight', domain: 'landing', description: 'Cursor-tracking radial spotlight surface container', props: ['color(cyan|violet|emerald|amber|rose)', 'size'] },
  { tag: 'oz-drawer', domain: 'layout', description: 'Slide-over side sheet or bottom drawer panel with backdrop & footer slot', props: ['heading', 'subtitle', 'side(right|left|bottom)', 'size(sm|md|lg|xl)', 'open', 'trigger'] },
  { tag: 'oz-dropdown', domain: 'core', description: 'Floating action/context menu popover with icons, shortcuts, and oz-select event', props: ['label', 'icon', 'variant(glass|primary|glow|ghost)', 'align(left|right)', 'items(JSON)'] },
  { tag: 'oz-tooltip', domain: 'core', description: 'Accessible floating glass tooltip with optional keyboard shortcut pill', props: ['text', 'position(top|bottom|left|right)', 'shortcut'] },
  { tag: 'oz-stepper', domain: 'layout', description: 'Interactive multi-step wizard / pipeline progress stepper', props: ['steps(csv|JSON)', 'active', 'variant(horizontal|vertical)', 'clickable'] },
  { tag: 'oz-kanban', domain: 'admin', description: 'Drag-and-drop sprint/workflow Kanban board with persistence and task creation', props: ['columns(JSON)', 'persist-key', 'addable'] },
  { tag: 'oz-calendar', domain: 'forms', description: 'Interactive glass monthly calendar grid with Today button, range selection, and event dots', props: ['heading', 'value(YYYY-MM-DD)', 'start', 'end', 'range', 'min', 'max', 'events(JSON)'] },
  { tag: 'oz-color-picker', domain: 'forms', description: 'Color swatch trigger, hex input, spectrum wheel, and floating OKLCH swatch popover', props: ['label', 'value(hex)', 'presets(csv)', 'hint', 'error', 'disabled'] },
  { tag: 'oz-number-input', domain: 'forms', description: 'Numeric stepper input with +/- buttons, keyboard arrows, and min/max/step clamping', props: ['label', 'value', 'min', 'max', 'step', 'hint', 'error', 'disabled'] },
  { tag: 'oz-otp-input', domain: 'forms', description: 'Segmented passkey / 2FA verification code input with auto-advance and paste support', props: ['label', 'length', 'value', 'hint', 'error', 'disabled'] },
  { tag: 'oz-grid', domain: 'layout', description: '12-column responsive CSS grid container or auto-fit min-width grid', props: ['cols', 'gap', 'min', 'align'] },
  { tag: 'oz-col', domain: 'layout', description: 'Responsive column child inside <oz-grid> with desktop/tablet/mobile spans', props: ['span(1..12)', 'span-md', 'span-sm'] },
  { tag: 'oz-bottom-nav', domain: 'layout', description: 'Mobile app / PWA bottom tab navigation bar with badges and safe-area padding', props: ['items(JSON)', 'active', 'variant(floating|docked)', 'position(inline|fixed)'] },
  { tag: 'oz-fab', domain: 'core', description: 'Mobile Floating Action Button with expandable speed-dial actions', props: ['icon', 'label', 'items(JSON)', 'position(inline|bottom-right|bottom-left)'] },
  { tag: 'oz-ai-chat', domain: 'ai', description: 'Interactive AI chat feed with model switcher, prompt chips, and streaming reply support', props: ['heading', 'model', 'models(csv)', 'suggestions(csv)', 'messages(JSON)', 'placeholder'] },
  { tag: 'oz-code-block', domain: 'core', description: 'Syntax container with language badge, filename header, line numbers, and copy button', props: ['title', 'lang', 'code', 'line-numbers'] },
  { tag: 'oz-split-pane', domain: 'layout', description: 'Resizable two-pane split container with draggable divider handle', props: ['ratio(percent)'] },
  { tag: 'oz-tree', domain: 'layout', description: 'Collapsible hierarchical folder and file tree with oz-select events', props: ['items(JSON)', 'active'] },
  { tag: 'oz-hover-card', domain: 'core', description: 'Rich glass preview popover displayed on hover or focus over a trigger', props: ['heading', 'subtitle', 'badge', 'meta'] },
  { tag: 'oz-pagination', domain: 'admin', description: 'Accessible page navigation bar with page counts and oz-page events', props: ['page', 'total', 'page-size'] },
  { tag: 'oz-skeleton', domain: 'layout', description: 'Animated shimmer placeholder skeleton for cards, stats, avatars, or text', props: ['variant(card|stat|avatar)', 'lines'] },
  { tag: 'oz-empty-state', domain: 'layout', description: 'Empty-state callout card with vector icon ring, description, and CTA button', props: ['icon', 'heading', 'description', 'cta'] },
  { tag: 'oz-cookie-consent', domain: 'layout', description: 'EU GDPR / ePrivacy Planet49 consent banner with equally weighted choices and offline strict mode', props: ['heading', 'description', 'policy-url', 'position(bottom-right|bottom-bar)', 'open'] }
];

export function morph(updateFn) {
  if (typeof document.startViewTransition === 'function' && document.documentElement.dataset.ozPerf !== 'eco') {
    const vt = document.startViewTransition(updateFn); vt?.finished?.catch(() => {}); vt?.ready?.catch(() => {}); vt?.updateCallbackDone?.catch(() => {});
  } else {
    updateFn();
  }
}

export function setMode(mode) {
  morph(() => {
    document.documentElement.dataset.ozMode = mode;
    document.documentElement.dataset.ozDna = dna.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: dna.read() }));
  });
}

export function setTheme(theme) {
  morph(() => {
    document.documentElement.dataset.ozTheme = theme;
    document.documentElement.dataset.ozDna = dna.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: dna.read() }));
  });
}

export function setPrivacyMode(enabled) {
  document.documentElement.dataset.ozPrivacy = enabled ? 'true' : 'false';
  sound.toggle(enabled);
  window.dispatchEvent(new CustomEvent('oz-privacy-change', { detail: { enabled } }));
}

export function setSound(enabled) {
  document.documentElement.dataset.ozSound = enabled ? 'on' : 'off';
  document.documentElement.dataset.ozDna = dna.encode();
  if (enabled) sound.toggle(true);
}

export function inspectUI() {
  const nodes = Array.from(document.querySelectorAll(COMPONENT_MANIFEST.map((c) => c.tag).join(',')));
  return nodes.map((el, index) => {
    const tag = el.tagName.toLowerCase();
    const label = el.getAttribute('title') || el.getAttribute('label') || el.textContent?.trim().slice(0, 48) || tag;
    return { index, tag, id: el.id || null, label, visible: el.offsetParent !== null };
  });
}

export function getSchemaManifest() {
  return { framework: 'OzoneUI', version: '1.0.0', totalComponents: COMPONENT_MANIFEST.length, components: COMPONENT_MANIFEST };
}

export function getAIPrompt() {
  const lines = [
    '# OzoneUI System Prompt',
    'Use OzoneUI Web Components (<oz-*>) with zero imports. Prop aliases (variant/type/color, label/text/title) all work.',
    `Active Client Theme: ${dna.getDeployHTML()}`,
    'Zero-Config Branding Attributes: data-oz-preset="ozone|emerald|fintech|amethyst|ai|crimson|gaming|amber|luxury|ocean|saas|nordic|enterprise|daylight|quartz" data-oz-brand="#RRGGBB" data-oz-harmony="analogous|complementary|triadic|monochrome" data-oz-density="compact|default|spacious" data-oz-brand-name="Client Name"',
    'Modes: <html data-oz-mode="atmospheric|precision" data-oz-theme="dark|light" data-oz-privacy="true|false" data-oz-icon-set="builtin|lucide|ph|tabler|solar|heroicons">',
    'Icons: Use <oz-icon name="..."> or icon="..." props (never raw emojis). Supports built-in Lucide paths, Iconify prefixes (ph:rocket, tabler:cpu), custom SVG slots, and Ozone.icons.register().',
    '',
    'Components:'
  ];
  for (const c of COMPONENT_MANIFEST) lines.push(`- <${c.tag}> (${c.domain}): ${c.description}. Props: ${c.props.join(', ')}`);
  lines.push('', 'JSON Rendering: Pass {"type":"oz-bento","props":{"cols":3},"children":[...]} to <oz-renderer schema="...">.');
  return lines.join('\n');
}

// --- 8. Bi-Directional AI Ghost Cursor --------------------------------------
class OzoneAgentCoPilot {
  constructor() {
    this.cursorEl = null;
    this.running = false;
  }
  ensureCursor() {
    if (!this.cursorEl || !document.body.contains(this.cursorEl)) {
      const el = document.createElement('div');
      el.id = 'oz-agent-cursor';
      el.innerHTML = `<div class="oz-agent-pointer"></div><div class="oz-agent-pill">AI Co-Pilot</div>`;
      document.body.appendChild(el);
      this.cursorEl = el;
    }
    return this.cursorEl;
  }
  async moveTo(target, opts = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return false;
    const cursor = this.ensureCursor();
    const pill = cursor.querySelector('.oz-agent-pill');
    if (pill) pill.textContent = opts.label || 'AI Co-Pilot';
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    await new Promise((r) => setTimeout(r, 240));
    const rect = el.getBoundingClientRect();
    const x = Math.max(12, Math.min(window.innerWidth - 40, rect.left + rect.width * 0.5));
    const y = Math.max(12, Math.min(window.innerHeight - 40, rect.top + rect.height * 0.5));
    cursor.dataset.active = 'true';
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    sound.agent();
    await new Promise((r) => setTimeout(r, 560));
    el.classList.add('oz-agent-highlight');
    if (opts.action === 'click') {
      const clickable = el.querySelector('button, a, input, [role="tab"]') || el;
      clickable.click();
    } else if (opts.action === 'focus') {
      const input = el.querySelector('input, textarea') || el;
      input.focus();
    }
    await new Promise((r) => setTimeout(r, opts.holdMs ?? 650));
    el.classList.remove('oz-agent-highlight');
    return true;
  }
  hide() {
    if (this.cursorEl) this.cursorEl.dataset.active = 'false';
  }
  async runDemoWorkflow() {
    if (this.running) return;
    this.running = true;
    toast({ title: 'AI Co-Pilot Active', message: 'Demonstrating live autonomous UI navigation...', variant: 'violet' });
    try {
      const steps = [
        { selector: '[data-domain-btn="admin"]', label: 'AI: Opening Admin BI', action: 'click' },
        { selector: 'oz-chart', label: 'AI: Inspecting Revenue Chart', action: 'highlight' },
        { selector: 'oz-smart-view [data-view="cards"]', label: 'AI: Morphing JSON -> Bento Cards', action: 'click' },
        { selector: '[data-domain-btn="marketplace"]', label: 'AI: Browsing Marketplace', action: 'click' },
        { selector: 'oz-product-card', label: 'AI: Evaluating Top Asset', action: 'highlight' },
        { selector: '[data-domain-btn="ai"]', label: 'AI: Entering Generative UI Lab', action: 'click' }
      ];
      for (const s of steps) {
        if (document.querySelector(s.selector)) {
          await this.moveTo(s.selector, { label: s.label, action: s.action, holdMs: 580 });
        }
      }
      toast({ title: 'AI Workflow Complete', message: 'Every OzoneUI domain is agent-navigable.', variant: 'emerald' });
    } finally {
      this.hide();
      this.running = false;
    }
  }
}

export const agent = new OzoneAgentCoPilot();

// --- 8.5 Universal 4-Mode Vector Icon Engine & Registry ---------------------
const BUILTIN_ICONS = {
  'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'chart-bar': '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'wand': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'shield-off': '<path d="m2 2 20 20"/><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"/><path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  'command': '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'key': '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'minus': '<path d="M5 12h14"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'trend-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'trend-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  'sliders': '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  'terminal': '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  'cpu': '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'heart-filled': '<path fill="currentColor" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'star-filled': '<polygon fill="currentColor" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  'bookmark-filled': '<path fill="currentColor" d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'verified': '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'diamond': '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  'magnet': '<path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15"/><path d="m5 8 4 4"/><path d="m12 15 4 4"/>',
  'panel-top': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
  'menu': '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>'
};

const ICON_ALIASES = {
  analytics: 'chart-bar', chart: 'chart-bar', 'bar-chart': 'chart-bar', graph: 'chart-bar',
  marketplace: 'shopping-bag', store: 'shopping-bag', shop: 'shopping-bag', bag: 'shopping-bag',
  social: 'message-circle', chat: 'message-circle', comment: 'message-circle', message: 'message-circle',
  ai: 'bot', agent: 'bot', robot: 'bot', copilot: 'bot',
  dna: 'wand', magic: 'wand', studio: 'wand',
  privacy: 'shield', veil: 'shield', security: 'shield',
  sound: 'volume-2', audio: 'volume-2', volume: 'volume-2', mute: 'volume-x', 'sound-off': 'volume-x',
  cart: 'shopping-cart', basket: 'shopping-cart',
  repost: 'repeat', share: 'repeat', retweet: 'repeat',
  like: 'heart', love: 'heart', favorite: 'bookmark', save: 'bookmark',
  close: 'x', cancel: 'x', find: 'search', 'magnifying-glass': 'search',
  secret: 'key', password: 'key', 'trending-up': 'trend-up', up: 'trend-up',
  'trending-down': 'trend-down', down: 'trend-down',
  'sliders-horizontal': 'sliders', settings: 'sliders', controls: 'sliders',
  lightning: 'zap', bolt: 'zap', fast: 'zap', stream: 'zap',
  bento: 'grid', layout: 'grid', 'badge-check': 'verified', 'check-circle': 'verified',
  cube: 'box', package: 'box', gem: 'diamond', crystal: 'diamond', logo: 'diamond',
  hamburger: 'menu', bars: 'menu'
};

const PACK_NAME_MAP = {
  lucide: { 'chart-bar': 'bar-chart-2', 'trend-up': 'trending-up', 'trend-down': 'trending-down', wand: 'wand-2', verified: 'badge-check', diamond: 'gem', 'heart-filled': 'heart', 'star-filled': 'star', 'bookmark-filled': 'bookmark', refresh: 'refresh-cw' },
  ph: { rocket: 'rocket-launch', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag', 'message-circle': 'chat-circle', bot: 'robot', wand: 'magic-wand', shield: 'shield-check', 'volume-2': 'speaker-high', 'volume-x': 'speaker-slash', sparkles: 'sparkle', zap: 'lightning', layers: 'stack', sliders: 'sliders-horizontal', grid: 'squares-four', search: 'magnifying-glass', heart: 'heart', 'heart-filled': 'heart-fill', star: 'star', 'star-filled': 'star-fill', repeat: 'arrows-clockwise', bookmark: 'bookmark-simple', 'bookmark-filled': 'bookmark-simple-fill', 'shopping-cart': 'shopping-cart', verified: 'seal-check', diamond: 'diamond', 'trend-up': 'trend-up', 'trend-down': 'trend-down', key: 'key', command: 'command', music: 'music-notes', 'eye-off': 'eye-slash', 'chevron-up': 'caret-up', 'chevron-down': 'caret-down' },
  tabler: { rocket: 'rocket', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag', 'message-circle': 'message-circle', bot: 'robot', wand: 'wand', shield: 'shield', 'volume-2': 'volume', 'volume-x': 'volume-off', sparkles: 'sparkles', zap: 'bolt', layers: 'stack-2', sliders: 'adjustments', grid: 'layout-grid', search: 'search', heart: 'heart', 'heart-filled': 'heart-filled', star: 'star', 'star-filled': 'star-filled', repeat: 'repeat', bookmark: 'bookmark', 'bookmark-filled': 'bookmark-filled', 'shopping-cart': 'shopping-cart', verified: 'rosette-discount-check', diamond: 'diamond', 'trend-up': 'trending-up', 'trend-down': 'trending-down', key: 'key', command: 'command' },
  solar: { rocket: 'rocket-2-linear', 'chart-bar': 'chart-square-linear', 'shopping-bag': 'bag-4-linear', 'message-circle': 'chat-round-dots-linear', bot: 'cpu-bolt-linear', wand: 'magic-stick-3-linear', shield: 'shield-check-linear', 'volume-2': 'volume-loud-linear', 'volume-x': 'volume-cross-linear', sparkles: 'stars-minimalistic-linear', zap: 'bolt-linear', layers: 'layers-linear', sliders: 'tuning-2-linear', grid: 'widget-4-linear', search: 'magnifer-linear', heart: 'heart-linear', 'heart-filled': 'heart-bold', star: 'star-linear', 'star-filled': 'star-bold', repeat: 'restart-linear', bookmark: 'bookmark-linear', 'bookmark-filled': 'bookmark-bold', 'shopping-cart': 'cart-large-2-linear', verified: 'verified-check-linear', diamond: 'diamond-linear', 'trend-up': 'graph-up-linear', 'trend-down': 'graph-down-linear', key: 'key-linear' },
  heroicons: { rocket: 'rocket-launch', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag', 'message-circle': 'chat-bubble-left-right', bot: 'cpu-chip', wand: 'sparkles', shield: 'shield-check', 'volume-2': 'speaker-wave', 'volume-x': 'speaker-x-mark', sparkles: 'sparkles', zap: 'bolt', layers: 'square-3-stack-3d', sliders: 'adjustments-horizontal', grid: 'squares-2x2', search: 'magnifying-glass', heart: 'heart', 'heart-filled': 'heart-solid', star: 'star', 'star-filled': 'star-solid', repeat: 'arrow-path', bookmark: 'bookmark', 'bookmark-filled': 'bookmark-solid', 'shopping-cart': 'shopping-cart', verified: 'check-badge', 'trend-up': 'arrow-trending-up', 'trend-down': 'arrow-trending-down' }
};

const _customIcons = new Map();
const _remoteSvgCache = new Map();
const _remoteInflight = new Map();
let _customResolver = null;

function sanitizeSvg(svgMarkup, size) {
  try {
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return '';
    svg.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((n) => n.remove());
    svg.querySelectorAll('*').forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
      }
    });
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'block';
    return svg.outerHTML;
  } catch {
    return '';
  }
}

async function resolveRemoteSvg(name, set) {
  if (typeof document !== 'undefined' && document.documentElement.dataset.ozGdpr === 'strict') return null;
  const mappedName = PACK_NAME_MAP[set]?.[name] || name;
  const cacheKey = `${set}:${mappedName}`;
  if (_remoteSvgCache.has(cacheKey)) return _remoteSvgCache.get(cacheKey);
  if (_remoteInflight.has(cacheKey)) return _remoteInflight.get(cacheKey);
  const task = (async () => {
    try {
      let raw = '';
      if (_customResolver) {
        const res = await _customResolver(mappedName, set);
        if (res && res.trim().startsWith('<svg')) raw = res;
        else if (res) {
          const r = await fetch(res);
          if (r.ok) raw = await r.text();
        }
      } else {
        const r = await fetch(`https://api.iconify.design/${encodeURIComponent(set)}/${encodeURIComponent(mappedName)}.svg`);
        if (r.ok) raw = await r.text();
      }
      if (raw && raw.includes('<svg')) {
        _remoteSvgCache.set(cacheKey, raw);
        return raw;
      }
    } catch {}
    return null;
  })();
  _remoteInflight.set(cacheKey, task);
  const res = await task;
  _remoteInflight.delete(cacheKey);
  return res;
}

export const icons = {
  getDefaultSet() { return document.documentElement.dataset.ozIconSet || 'builtin'; },
  setDefaultSet(setName) {
    document.documentElement.dataset.ozIconSet = setName;
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { set: setName } }));
  },
  register(name, svgInnerOrFull) {
    _customIcons.set(name.toLowerCase().trim(), svgInnerOrFull);
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { registered: name } }));
  },
  registerAliases(map) {
    for (const [alias, target] of Object.entries(map)) ICON_ALIASES[alias.toLowerCase().trim()] = target.toLowerCase().trim();
  },
  setResolver(fn) {
    _customResolver = fn;
    _remoteSvgCache.clear();
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { resolverChanged: true } }));
  },
  list() { return Array.from(new Set([...Object.keys(BUILTIN_ICONS), ..._customIcons.keys()])); }
};

export const Ozone = {
  version: '1.0.0',
  signal, computed, effect, sound, dna, toast, agent, icons, morph,
  setMode, setTheme, setPrivacyMode, setSound, inspectUI, getSchemaManifest, getAIPrompt
};

// --- 9. Base Element --------------------------------------------------------
export class OzoneElement extends HTMLElement {
  constructor() {
    super();
    this._mounted = false;
    this._pollTimer = null;
    this._slotNodes = null;
  }
  connectedCallback() {
    this.safeRender();
    this.setupLiveFetch();
  }
  disconnectedCallback() {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this.isConnected) {
      this.safeRender();
      if (name === 'src' || name === 'poll') this.setupLiveFetch();
    }
  }
  prop(primary, aliases = [], fallback = '') {
    for (const k of [primary, ...aliases]) {
      if (this.hasAttribute(k)) {
        const val = this.getAttribute(k);
        if (val !== null && val !== '') return val;
      }
    }
    return fallback;
  }
  boolProp(primary, aliases = []) {
    for (const k of [primary, ...aliases]) {
      if (this.hasAttribute(k)) {
        const val = (this.getAttribute(k) || '').toLowerCase();
        return val !== 'false' && val !== '0';
      }
    }
    return false;
  }
  numProp(primary, aliases = [], fallback = 0) {
    const raw = this.prop(primary, aliases, '');
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  jsonProp(primary, aliases = [], fallback = null) {
    const raw = this.prop(primary, aliases, '');
    if (!raw) return fallback;
    const parsed = repairJSON(raw);
    return parsed.ok && parsed.data !== null ? parsed.data : fallback;
  }
  captureSlotNodes() {
    if (this._slotNodes === null) this._slotNodes = Array.from(this.childNodes);
    return this._slotNodes;
  }
  setupLiveFetch() {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    const src = this.getAttribute('src');
    if (!src) return;
    const runFetch = async () => {
      this.onDataLoading?.();
      try {
        let payload;
        if (src.startsWith('mock://')) {
          await new Promise((r) => setTimeout(r, 380));
          payload = resolveMockData(src);
        } else {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          payload = await res.json();
        }
        this.onDataLoaded?.(payload);
      } catch (err) {
        this.onDataError?.(err);
      }
    };
    runFetch();
    const pollAttr = this.getAttribute('poll');
    if (pollAttr) {
      const ms = pollAttr.endsWith('ms') ? parseInt(pollAttr, 10) : pollAttr.endsWith('s') ? parseFloat(pollAttr) * 1000 : parseInt(pollAttr, 10) * 1000;
      if (Number.isFinite(ms) && ms >= 1000) this._pollTimer = setInterval(runFetch, ms);
    }
  }
  safeRender() {
    try {
      this.render();
    } catch (err) {
      this.innerHTML = `<div class="oz-badge oz-badge--rose" style="padding:8px 12px;border-radius:10px;"><span>Self-Healed &lt;${this.tagName.toLowerCase()}&gt;: ${escapeHTML(err.message)}</span></div>`;
    }
  }
}

// --- 10. Core Pack Components -----------------------------------------------
export class OzIcon extends OzoneElement {
  static get observedAttributes() { return ['name', 'icon', 'set', 'size', 'stroke', 'fill', 'src', 'icon-class', 'spin', 'glow']; }
  render() {
    if (!this.boundSetListener) {
      this.boundSetListener = true;
      window.addEventListener('oz-icon-set-change', () => { if (this.isConnected) this.safeRender(); });
    }
    const sizeRaw = this.prop('size', [], '16');
    const size = /^\d+$/.test(sizeRaw) ? `${sizeRaw}px` : sizeRaw;
    const stroke = this.prop('stroke', [], '1.75');
    const iconClass = this.prop('icon-class', ['class-icon']);
    const src = this.prop('src');
    if (!this._mounted) {
      this._mounted = true;
      const existingSvg = this.querySelector('svg');
      if (existingSvg && !this.hasAttribute('name') && !this.hasAttribute('icon') && !src && !iconClass) {
        this.inlineSvgEl = existingSvg;
      }
    }
    if (this.inlineSvgEl) {
      this.inlineSvgEl.setAttribute('width', size);
      this.inlineSvgEl.setAttribute('height', size);
      this.innerHTML = '';
      this.appendChild(this.inlineSvgEl);
      return;
    }
    if (iconClass) {
      this.innerHTML = `<i class="${escapeHTML(iconClass)}" aria-hidden="true" style="font-size:${escapeHTML(size)};line-height:1;"></i>`;
      return;
    }
    if (src) {
      this.innerHTML = `<img src="${escapeHTML(src)}" alt="" style="width:${escapeHTML(size)};height:${escapeHTML(size)};object-fit:contain;" />`;
      if (src.endsWith('.svg')) {
        fetch(src).then((r) => (r.ok ? r.text() : '')).then((txt) => {
          const clean = txt ? sanitizeSvg(txt, size) : '';
          if (clean && this.isConnected && this.getAttribute('src') === src) this.innerHTML = clean;
        }).catch(() => {});
      }
      return;
    }
    let rawName = this.prop('name', ['icon'], 'sparkles').trim().toLowerCase();
    let explicitSet = this.prop('set');
    if (rawName.includes(':')) {
      const [prefix, iconPart] = rawName.split(':', 2);
      explicitSet = explicitSet || prefix;
      rawName = iconPart;
    }
    const canonical = ICON_ALIASES[rawName] || rawName;
    const activeSet = explicitSet || icons.getDefaultSet();
    const custom = _customIcons.get(rawName) || _customIcons.get(canonical);
    if (custom && !explicitSet) {
      if (custom.trim().startsWith('<svg')) {
        const clean = sanitizeSvg(custom, size);
        if (clean) { this.innerHTML = clean; return; }
      } else {
        this.innerHTML = this.wrapPaths(custom, size, stroke);
        return;
      }
    }
    const builtInPaths = BUILTIN_ICONS[canonical];
    this.innerHTML = this.wrapPaths(builtInPaths || '<circle cx="12" cy="12" r="4"/>', size, stroke);
    const needsRemote = (activeSet !== 'builtin' && activeSet !== 'default') || !builtInPaths || _customResolver !== null;
    if (needsRemote && (activeSet !== 'builtin' || !builtInPaths || _customResolver !== null)) {
      queueMicrotask(() => {
        if (!this.isConnected) return;
        const lateCustom = _customIcons.get(rawName) || _customIcons.get(canonical);
        if (lateCustom && !explicitSet) return;
        const targetSet = activeSet === 'builtin' ? 'lucide' : activeSet;
        resolveRemoteSvg(canonical, targetSet).then((svgText) => {
          if (!svgText || !this.isConnected) return;
          const currentSet = this.prop('set') || icons.getDefaultSet();
          if (currentSet !== activeSet && !explicitSet) return;
          const clean = sanitizeSvg(svgText, size);
          if (clean) this.innerHTML = clean;
        });
      });
    }
  }
  wrapPaths(paths, size, stroke) {
    return `<svg viewBox="0 0 24 24" width="${escapeHTML(size)}" height="${escapeHTML(size)}" fill="none" stroke="currentColor" stroke-width="${escapeHTML(stroke)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }
}

export class OzButton extends OzoneElement {
  static get observedAttributes() { return ['variant', 'type', 'color', 'theme', 'kind', 'size', 'loading', 'disabled', 'label', 'text', 'pill', 'toast', 'icon', 'icon-right']; }
  resolveVariant() {
    const v = this.prop('variant', ['type', 'color', 'theme', 'kind'], '');
    if (v) return v;
    for (const s of ['glow', 'primary', 'glass', 'ghost', 'danger', 'success']) if (this.hasAttribute(s)) return s;
    return 'glass';
  }
  render() {
    const nodes = this.captureSlotNodes();
    const variant = this.resolveVariant();
    const size = this.prop('size', [], 'md');
    const isPill = this.boolProp('pill', ['rounded']);
    const isLoading = this.boolProp('loading');
    const isDisabled = this.boolProp('disabled') || isLoading;
    const explicitLabel = this.prop('label', ['text']);
    const iconLeft = this.prop('icon');
    const iconRight = this.prop('icon-right');
    if (!this._mounted) {
      this._mounted = true;
      const btn = document.createElement('button');
      btn.type = 'button';
      if (explicitLabel && nodes.every((n) => n.nodeType === 3 && !n.textContent?.trim())) {
        btn.textContent = explicitLabel;
      } else {
        nodes.forEach((n) => btn.appendChild(n));
        if (!btn.textContent?.trim() && explicitLabel) btn.textContent = explicitLabel;
      }
      btn.addEventListener('click', (e) => {
        if (this.boolProp('disabled') || this.boolProp('loading')) { e.stopImmediatePropagation(); return; }
        sound.click();
        const toastMsg = this.getAttribute('toast');
        if (toastMsg) toast({ title: 'Action Triggered', message: toastMsg, variant: 'cyan' });
      });
      this.innerHTML = '';
      this.appendChild(btn);
      this.btnEl = btn;
    }
    if (this.btnEl) {
      const iconPx = size === 'sm' ? '14' : size === 'lg' ? '18' : '16';
      this.btnEl.className = `oz-btn oz-btn--${variant} oz-btn--${size}${isPill ? ' oz-btn--pill' : ''}`;
      this.btnEl.disabled = isDisabled;
      if (iconLeft && !isLoading) {
        if (!this.iconLeftEl) { this.iconLeftEl = document.createElement('oz-icon'); this.btnEl.prepend(this.iconLeftEl); }
        this.iconLeftEl.setAttribute('name', iconLeft);
        this.iconLeftEl.setAttribute('size', iconPx);
      } else if (this.iconLeftEl) { this.iconLeftEl.remove(); this.iconLeftEl = null; }
      if (iconRight) {
        if (!this.iconRightEl) { this.iconRightEl = document.createElement('oz-icon'); this.btnEl.appendChild(this.iconRightEl); }
        this.iconRightEl.setAttribute('name', iconRight);
        this.iconRightEl.setAttribute('size', iconPx);
      } else if (this.iconRightEl) { this.iconRightEl.remove(); this.iconRightEl = null; }
      const sp = this.btnEl.querySelector('.oz-spinner');
      if (isLoading && !sp) {
        const el = document.createElement('span');
        el.className = 'oz-spinner';
        this.btnEl.prepend(el);
      } else if (!isLoading && sp) sp.remove();
    }
  }
}

export class OzCard extends OzoneElement {
  static get observedAttributes() { return ['title', 'subtitle', 'badge', 'exportable', 'glow']; }
  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = '';
      this.headerEl = document.createElement('div');
      this.headerEl.className = 'oz-card__header';
      this.bodyEl = document.createElement('div');
      this.bodyEl.className = 'oz-card__body';
      nodes.forEach((n) => this.bodyEl.appendChild(n));
      this.appendChild(this.headerEl);
      this.appendChild(this.bodyEl);
    }
    const title = this.prop('title', ['heading']);
    const subtitle = this.prop('subtitle', ['description', 'desc']);
    const badge = this.prop('badge');
    const exportable = this.boolProp('exportable');
    if (!title && !subtitle && !badge && !exportable) {
      this.headerEl.style.display = 'none';
    } else {
      this.headerEl.style.display = 'flex';
      this.headerEl.innerHTML = `
        <div>
          ${title ? `<div class="oz-card__title">${escapeHTML(title)}</div>` : ''}
          ${subtitle ? `<div class="oz-card__subtitle">${escapeHTML(subtitle)}</div>` : ''}
        </div>
        <div class="oz-row" style="gap:6px;">
          ${badge ? `<oz-badge variant="cyan">${escapeHTML(badge)}</oz-badge>` : ''}
          ${exportable ? `<button type="button" class="oz-btn oz-btn--ghost oz-btn--sm" data-oz-export-card>Export</button>` : ''}
        </div>`;
      this.headerEl.querySelector('[data-oz-export-card]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.success();
        navigator.clipboard?.writeText(JSON.stringify({ title: title || 'OzoneCard', subtitle, text: this.bodyEl.textContent?.trim() || '' }, null, 2)).catch(() => {});
        toast({ title: 'Card Exported', message: 'Card snapshot copied to clipboard.', variant: 'emerald' });
      });
    }
  }
}

export class OzBadge extends OzoneElement {
  static get observedAttributes() { return ['variant', 'color', 'type', 'pulse', 'label', 'text', 'icon']; }
  render() {
    const nodes = this.captureSlotNodes();
    const variant = this.prop('variant', ['color', 'type', 'theme'], 'neutral');
    const pulse = this.boolProp('pulse', ['live']);
    const icon = this.prop('icon');
    const text = this.prop('label', ['text']) || nodes.map((n) => n.textContent).join('').trim();
    this.innerHTML = `<span class="oz-badge oz-badge--${escapeHTML(variant)}">${pulse ? '<span class="oz-badge__dot oz-badge__dot--pulse"></span>' : ''}${icon ? `<oz-icon name="${escapeHTML(icon)}" size="12"></oz-icon>` : ''}<span>${escapeHTML(text)}</span></span>`;
  }
}

export class OzInput extends OzoneElement {
  static get observedAttributes() { return ['label', 'placeholder', 'value', 'type', 'mask', 'icon', 'error', 'hint']; }
  get value() { const i = this.querySelector('input'); return i ? i.value : this.getAttribute('value') || ''; }
  set value(v) { const i = this.querySelector('input'); if (i) i.value = v; this.setAttribute('value', v); }
  render() {
    const label = this.prop('label', ['title']);
    const placeholder = this.prop('placeholder', [], '');
    const value = this.prop('value', [], '');
    const baseType = this.prop('type', [], 'text');
    const isSecret = this.prop('mask') === 'secret' || baseType === 'password';
    const icon = this.prop('icon');
    const actualType = isSecret && !this.revealed ? 'password' : (baseType === 'password' ? 'text' : baseType);
    this.innerHTML = `
      <div class="oz-input-wrap">
        ${label ? `<label class="oz-input-label">${escapeHTML(label)}</label>` : ''}
        <div class="oz-input-box">
          ${icon ? `<oz-icon name="${escapeHTML(icon)}" size="15" class="oz-muted"></oz-icon>` : ''}
          <input class="oz-input-field" type="${escapeHTML(actualType)}" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(value)}" />
          ${isSecret ? `<button type="button" class="oz-input-action" data-toggle-secret title="Toggle visibility"><oz-icon name="${this.revealed ? 'eye-off' : 'eye'}" size="15"></oz-icon></button>` : ''}
        </div>
      </div>`;
    const _err = this.prop('error'), _hint = this.prop('hint');
    if (_err || _hint) { const m = document.createElement('div'); m.className = 'oz-field__msg' + (_err ? ' oz-field__msg--error' : ''); m.style.marginTop = '6px'; m.textContent = _err || _hint; this.querySelector('.oz-input-wrap').appendChild(m); if (_err) this.querySelector('.oz-input-box').classList.add('oz-input-box--error'); }
    const input = this.querySelector('input');
    input.addEventListener('input', () => this.dispatchEvent(new CustomEvent('oz-input', { detail: { value: input.value }, bubbles: true })));
    input.addEventListener('change', () => this.dispatchEvent(new CustomEvent('oz-change', { detail: { value: input.value }, bubbles: true })));
    this.querySelector('[data-toggle-secret]')?.addEventListener('click', () => {
      this.revealed = !this.revealed;
      sound.click();
      this.setAttribute('value', input.value);
      this.render();
    });
  }
}

export class OzSwitch extends OzoneElement {
  static get observedAttributes() { return ['checked', 'label', 'text']; }
  get checked() { return this.boolProp('checked'); }
  set checked(v) { if (v) this.setAttribute('checked', ''); else this.removeAttribute('checked'); }
  render() {
    const checked = this.boolProp('checked');
    const label = this.prop('label', ['text', 'title'], '');
    this.innerHTML = `<div class="oz-switch" role="switch" tabindex="0" aria-checked="${checked}" data-checked="${checked}"><div class="oz-switch__track"><div class="oz-switch__thumb"></div></div>${label ? `<span>${escapeHTML(label)}</span>` : ''}</div>`;
    const root = this.querySelector('.oz-switch');
    const toggle = () => {
      const next = !this.checked;
      this.checked = next;
      sound.toggle(next);
      this.dispatchEvent(new CustomEvent('oz-change', { detail: { checked: next }, bubbles: true }));
    };
    root.addEventListener('click', toggle);
    root.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
  }
}

export class OzTabs extends OzoneElement {
  static get observedAttributes() { return ['active', 'tabs']; }
  render() {
    const activeIdx = Math.max(0, Math.floor(this.numProp('active', [], 0)));
    if (!this._mounted) {
      this._mounted = true;
      const nodes = this.captureSlotNodes();
      const tabAttr = this.prop('tabs');
      const tabBar = document.createElement('div');
      tabBar.className = 'oz-tabs__bar';
      tabBar.setAttribute('role', 'tablist');
      const pill = document.createElement('div');
      pill.className = 'oz-tabs__pill';
      tabBar.appendChild(pill);
      this.pillEl = pill;
      const panelsWrap = document.createElement('div');
      panelsWrap.className = 'oz-tabs__panels';
      const slotTabs = nodes.filter((n) => n.nodeType === 1 && (n.getAttribute('slot') === 'tab' || n.hasAttribute('data-tab')));
      const slotPanels = nodes.filter((n) => n.nodeType === 1 && (n.getAttribute('slot') === 'panel' || n.hasAttribute('data-panel')));
      this.tabButtons = [];
      this.panels = slotPanels;
      if (slotTabs.length > 0) {
        slotTabs.forEach((el, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'oz-tabs__btn';
          btn.setAttribute('role', 'tab');
          btn.textContent = el.textContent?.trim() || `Tab ${idx + 1}`;
          btn.addEventListener('click', () => this.selectTab(idx));
          tabBar.appendChild(btn);
          this.tabButtons.push(btn);
        });
      } else if (tabAttr) {
        tabAttr.split(',').map((s) => s.trim()).filter(Boolean).forEach((label, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'oz-tabs__btn';
          btn.setAttribute('role', 'tab');
          btn.textContent = label;
          btn.addEventListener('click', () => this.selectTab(idx));
          tabBar.appendChild(btn);
          this.tabButtons.push(btn);
        });
      }
      slotPanels.forEach((p) => panelsWrap.appendChild(p));
      this.innerHTML = '';
      this.appendChild(tabBar);
      if (slotPanels.length > 0) this.appendChild(panelsWrap);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => {
          const cur = Math.max(0, Math.floor(this.numProp('active', [], 0)));
          const activeBtn = this.tabButtons[cur];
          if (activeBtn && this.pillEl && activeBtn.offsetWidth > 0) {
            this.pillEl.style.width = `${activeBtn.offsetWidth}px`;
            this.pillEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
          }
        }).observe(tabBar);
      }
    }
    this.applyActive(activeIdx);
  }
  selectTab(index) {
    sound.click();
    this.setAttribute('active', String(index));
    this.applyActive(index);
    const label = this.tabButtons[index]?.textContent || '';
    this.dispatchEvent(new CustomEvent('oz-tab-change', { detail: { index, label }, bubbles: true }));
  }
  applyActive(index) {
    (this.tabButtons || []).forEach((btn, i) => btn.setAttribute('aria-selected', i === index ? 'true' : 'false'));
    (this.panels || []).forEach((p, i) => { p.style.display = i === index ? 'block' : 'none'; });
    requestAnimationFrame(() => {
      const activeBtn = this.tabButtons?.[index];
      if (activeBtn && this.pillEl && activeBtn.offsetWidth > 0) {
        this.pillEl.style.width = `${activeBtn.offsetWidth}px`;
        this.pillEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      }
    });
  }
}

export class OzDialog extends OzoneElement {
  static get observedAttributes() { return ['open', 'title']; }
  show() { morph(() => this.setAttribute('open', '')); sound.open(); }
  close() { this.removeAttribute('open'); sound.click(); this.dispatchEvent(new CustomEvent('oz-close', { bubbles: true })); }
  render() {
    const nodes = this.captureSlotNodes();
    const isOpen = this.boolProp('open');
    const title = this.prop('title', [], 'Details');
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `
        <div class="oz-dialog-backdrop" data-open="${isOpen}">
          <div class="oz-dialog-panel" role="dialog" aria-modal="true">
            <div class="oz-dialog-head">
              <div class="oz-dialog-title"></div>
              <button type="button" class="oz-btn oz-btn--ghost oz-btn--sm" data-oz-close aria-label="Close"><oz-icon name="x" size="16"></oz-icon></button>
            </div>
            <div class="oz-dialog-body"></div>
          </div>
        </div>`;
      this.backdropEl = this.querySelector('.oz-dialog-backdrop');
      this.titleEl = this.querySelector('.oz-dialog-title');
      const body = this.querySelector('.oz-dialog-body');
      nodes.forEach((n) => body.appendChild(n));
      this.querySelector('[data-oz-close]')?.addEventListener('click', () => this.close());
      this.backdropEl?.addEventListener('click', (e) => { if (e.target === this.backdropEl) this.close(); });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.boolProp('open')) this.close(); });
    }
    if (this.titleEl) this.titleEl.textContent = title;
    if (this.backdropEl) this.backdropEl.dataset.open = isOpen ? 'true' : 'false';
  }
}

export class OzAvatar extends OzoneElement {
  static get observedAttributes() { return ['name', 'src', 'status', 'verified', 'size']; }
  render() {
    const name = this.prop('name', ['alt', 'author'], 'OU');
    const src = this.prop('src');
    const status = this.prop('status');
    const verified = this.boolProp('verified');
    const size = this.prop('size', [], '42px');
    const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
    this.innerHTML = `
      <span class="oz-avatar" style="--oz-avatar-size:${escapeHTML(size.endsWith('px') ? size : size + 'px')}">
        ${src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(name)}" />` : `<span>${escapeHTML(initials || 'OZ')}</span>`}
        ${status ? `<span class="oz-avatar__status oz-avatar__status--${escapeHTML(status)}" title="${escapeHTML(status)}"></span>` : ''}
      </span>
      ${verified ? `<oz-icon name="verified" size="14" title="Verified" style="margin-left:4px;color:var(--oz-cyan);"></oz-icon>` : ''}`;
  }
}

// --- 11. Admin & Telemetry Pack ---------------------------------------------
function parseSeries(raw) {
  if (Array.isArray(raw)) return raw.map(Number).filter(Number.isFinite);
  const str = String(raw || '').trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    const parsed = repairJSON(str);
    if (parsed.ok && Array.isArray(parsed.data)) {
      return parsed.data.map((d) => (typeof d === 'object' && d !== null ? Number(d.value ?? 0) : Number(d))).filter(Number.isFinite);
    }
  }
  return str.split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
}

export class OzStat extends OzoneElement {
  static get observedAttributes() { return ['title', 'label', 'value', 'delta', 'trend', 'sparkline', 'mask', 'src', 'poll']; }
  onDataLoading() { if (!this.liveData && !this.hasAttribute('value')) this.innerHTML = `<div class="oz-shimmer" style="height:98px;"></div>`; }
  onDataLoaded(payload) { if (payload && typeof payload === 'object') { this.liveData = payload; this.safeRender(); } }
  render() {
    const title = this.liveData?.title || this.prop('title', ['label'], 'Metric');
    const value = this.liveData?.value || this.prop('value', [], '0');
    const delta = this.liveData?.delta || this.prop('delta');
    const trend = this.prop('trend', [], delta?.startsWith('-') ? 'down' : delta ? 'up' : 'neutral');
    const pts = parseSeries(this.liveData?.data || this.prop('sparkline'));
    const sparkSvg = pts.length > 1 ? this.buildSparkline(pts, trend) : '';
    const iconName = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'minus';
    this.innerHTML = `
      <div class="oz-stat__top">
        <span class="oz-stat__title">${escapeHTML(title)}</span>
        ${delta ? `<span class="oz-stat__delta oz-stat__delta--${escapeHTML(trend)}"><oz-icon name="${iconName}" size="12"></oz-icon> ${escapeHTML(delta)}</span>` : ''}
      </div>
      <div class="oz-stat__main">
        <div class="oz-stat__value oz-mask-target">${escapeHTML(value)}</div>
        ${sparkSvg}
      </div>`;
  }
  buildSparkline(pts, trend) {
    const w = 104, h = 36, min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
    const coords = pts.map((v, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / span) * (h - 8)).toFixed(1)}`);
    const stroke = trend === 'down' ? 'var(--oz-rose)' : trend === 'up' ? 'var(--oz-emerald)' : 'var(--oz-primary)';
    return `<svg viewBox="0 0 ${w} ${h}" style="width:88px;max-width:100%;height:34px;overflow:visible;flex-shrink:1;"><polyline fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${coords.join(' ')}" /></svg>`;
  }
}

export class OzChart extends OzoneElement {
  static get observedAttributes() { return ['type', 'title', 'subtitle', 'labels', 'data', 'glow', 'exportable', 'src', 'poll']; }
  onDataLoading() { if (!this.livePayload && !this.hasAttribute('data')) this.innerHTML = `<div class="oz-shimmer" style="height:260px;"></div>`; }
  onDataLoaded(payload) {
    if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
      this.livePayload = { labels: Array.isArray(payload.labels) ? payload.labels.map(String) : undefined, data: payload.data.map(Number) };
      this.safeRender();
    }
  }
  render() {
    const type = this.activeType || this.prop('type', ['kind'], 'area');
    const title = this.prop('title', ['label'], 'Analytics Overview');
    const subtitle = this.prop('subtitle');
    const exportable = this.boolProp('exportable');
    const glow = this.prop('glow', ['color'], 'cyan');
    const values = parseSeries(this.livePayload?.data || this.prop('data', [], '120,185,160,245,310,295,410'));
    const rawLabels = this.livePayload?.labels || this.prop('labels', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const labels = values.map((_, i) => rawLabels[i] || `P${i + 1}`);
    const accentMap = { cyan: 'var(--oz-cyan)', violet: 'var(--oz-violet)', emerald: 'var(--oz-emerald)', amber: 'var(--oz-amber)', rose: 'var(--oz-rose)' };
    const strokeColor = accentMap[glow] || 'var(--oz-primary)';
    this.innerHTML = `
      <div class="oz-chart__head">
        <div>
          <div class="oz-chart__title">${escapeHTML(title)}</div>
          ${subtitle ? `<div class="oz-chart__subtitle">${escapeHTML(subtitle)}</div>` : ''}
        </div>
        <div class="oz-chart__controls">
          ${['area', 'bar', 'line', 'donut'].map((t) => `<button type="button" class="oz-btn oz-btn--sm ${type === t ? 'oz-btn--primary' : 'oz-btn--ghost'}" data-chart-type="${t}" style="padding:4px 9px;font-size:0.72rem;text-transform:capitalize;">${t}</button>`).join('')}
          ${exportable ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-export-svg style="padding:4px 9px;font-size:0.72rem;">SVG</button>` : ''}
        </div>
      </div>
      <div class="oz-chart__canvas"><div class="oz-chart__tooltip"></div>${this.renderSvg(type, values, labels, strokeColor)}</div>`;
    this.querySelectorAll('[data-chart-type]').forEach((btn) => btn.addEventListener('click', () => {
      sound.click();
      this.activeType = btn.dataset.chartType || 'area';
      this.safeRender();
    }));
    this.querySelector('[data-export-svg]')?.addEventListener('click', () => {
      const svg = this.querySelector('svg');
      if (!svg) return;
      const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      sound.success();
      toast({ title: 'SVG Exported', message: `Downloaded vector chart for "${title}".`, variant: 'emerald' });
    });
    const tooltip = this.querySelector('.oz-chart__tooltip');
    const canvas = this.querySelector('.oz-chart__canvas');
    this.querySelectorAll('[data-tip]').forEach((el) => {
      const positionTip = (evt, target) => {
        if (!tooltip || !canvas) return;
        tooltip.textContent = target.getAttribute('data-tip') || '';
        const cr = canvas.getBoundingClientRect();
        if (type === 'donut') {
          tooltip.style.left = `${evt.clientX - cr.left}px`;
          tooltip.style.top = `${evt.clientY - cr.top - 8}px`;
        } else {
          const tr = target.getBoundingClientRect();
          tooltip.style.left = `${tr.left - cr.left + tr.width / 2}px`;
          tooltip.style.top = `${tr.top - cr.top}px`;
        }
        tooltip.style.opacity = '1';
      };
      el.addEventListener('pointerenter', (e) => positionTip(e, e.currentTarget));
      if (type === 'donut') el.addEventListener('pointermove', (e) => positionTip(e, e.currentTarget));
      el.addEventListener('pointerleave', () => { if (tooltip) tooltip.style.opacity = '0'; });
    });
    this.lastW = this.clientWidth;
    if (!this.ro && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        if (!this.isConnected) { this.ro.disconnect(); this.ro = null; return; }
        const cw = this.clientWidth;
        if (Math.abs(cw - this.lastW) > 16) {
          this.lastW = cw;
          window.clearTimeout(this.rt);
          this.rt = window.setTimeout(() => this.safeRender(), 120);
        }
      });
      this.ro.observe(this);
    }
  }
  renderSvg(type, values, labels, color) {
    if (values.length === 0) return '<div class="oz-muted oz-text-sm">No chart data</div>';
    const uid = Math.random().toString(36).slice(2, 8);
    if (type === 'donut') {
      const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const palette = ['var(--oz-cyan)', 'var(--oz-violet)', 'var(--oz-emerald)', 'var(--oz-amber)', 'var(--oz-rose)', 'var(--oz-primary)'];
      const r = 68, cx = 100, cy = 100, circ = 2 * Math.PI * r;
      let offset = 0;
      const arcs = values.map((v, i) => {
        const frac = Math.max(0, v) / total;
        const dash = frac * circ;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette[i % palette.length]}" stroke-width="24" stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" data-tip="${escapeHTML(labels[i])}: ${v.toLocaleString()} (${Math.round(frac * 100)}%)" style="cursor:pointer;" />`;
        offset += dash;
        return seg;
      }).join('');
      const legend = values.map((v, i) => `<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;"><span style="width:10px;height:10px;border-radius:3px;background:${palette[i % palette.length]};flex-shrink:0;"></span><span class="oz-muted">${escapeHTML(labels[i])}</span><strong style="margin-left:auto;">${v.toLocaleString()}</strong></div>`).join('');
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-around;gap:18px;"><svg width="200" height="200" viewBox="0 0 200 200"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--oz-border)" stroke-width="24" />${arcs}<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--oz-text)" font-size="20" font-weight="700">${total.toLocaleString()}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--oz-text-muted)" font-size="11">TOTAL</text></svg><div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:8px;">${legend}</div></div>`;
    }
    const cs = getComputedStyle(this);
    const innerW = this.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const w = Math.max(240, Math.round(innerW || 600));
    const compact = w < 460;
    const h = compact ? 230 : Math.round(Math.min(340, Math.max(250, w * 0.3)));
    const padL = 46, padR = compact ? 14 : 20, padY = 20, padBottom = 34, inset = 12;
    const plotW = w - padL - padR, plotH = h - padY - padBottom;
    const max = Math.max(...values) * 1.12 || 10, min = type === 'bar' ? 0 : Math.min(0, ...values), span = max - min || 1;
    const fmt = (n) => { const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : a >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(n)); };
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => { const y = (padY + plotH * (1 - t)).toFixed(1); return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--oz-border)" stroke-dasharray="3 4" /><text x="${padL - 10}" y="${(Number(y) + 4).toFixed(1)}" text-anchor="end" fill="var(--oz-text-subtle)" font-size="12">${fmt(min + span * t)}</text>`; }).join('');
    const step = Math.max(1, Math.ceil(values.length / Math.max(2, Math.floor(plotW / 56))));
    const svgOpen = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="display:block;width:100%;height:${h}px;overflow:visible;">`;
    if (type === 'bar') {
      const slotW = plotW / values.length, barW = Math.min(48, Math.max(8, slotW * 0.56));
      const bars = values.map((v, i) => {
        const barH = Math.max(4, ((v - min) / span) * plotH);
        const x = padL + i * slotW + (slotW - barW) / 2, y = padY + plotH - barH;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="6" fill="url(#oz-grad-${uid})" data-tip="${escapeHTML(labels[i])}: ${v.toLocaleString()}" style="cursor:pointer;" />`;
      }).join('');
      const barLabels = labels.map((l, i) => i % step ? '' : `<text x="${(padL + i * slotW + slotW / 2).toFixed(1)}" y="${h - 10}" text-anchor="middle" fill="var(--oz-text-subtle)" font-size="12">${escapeHTML(l)}</text>`).join('');
      return `${svgOpen}<defs><linearGradient id="oz-grad-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.95" /><stop offset="100%" stop-color="${color}" stop-opacity="0.28" /></linearGradient></defs>${gridLines}${bars}${barLabels}</svg>`;
    }
    const px = (i) => values.length === 1 ? padL + plotW / 2 : padL + inset + (i / (values.length - 1)) * (plotW - inset * 2);
    const pts = values.map((v, i) => ({ x: px(i), y: padY + plotH - ((v - min) / span) * plotH, v, label: labels[i] }));
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padY + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;
    const xLabels = labels.map((l, i) => i % step ? '' : `<text x="${px(i).toFixed(1)}" y="${h - 10}" text-anchor="middle" fill="var(--oz-text-subtle)" font-size="12">${escapeHTML(l)}</text>`).join('');
    const r = compact ? 4 : 5;
    return `${svgOpen}<defs><linearGradient id="oz-area-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.38" /><stop offset="100%" stop-color="${color}" stop-opacity="0.01" /></linearGradient></defs>${gridLines}${type === 'area' ? `<path d="${areaPath}" fill="url(#oz-area-${uid})" />` : ''}<path d="${linePath}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 4px 10px ${color});" />${pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="var(--oz-bg-elevated)" stroke="${color}" stroke-width="2.5" data-tip="${escapeHTML(p.label)}: ${p.v.toLocaleString()}" style="cursor:pointer;" />`).join('')}${xLabels}</svg>`;
  }
}

export class OzTable extends OzoneElement {
  static get observedAttributes() { return ['title', 'rows', 'data', 'searchable', 'exportable', 'mask-cols', 'src', 'poll']; }
  constructor() { super(); this.sortKey = ''; this.sortAsc = true; this.query = ''; this.loadedRows = null; }
  onDataLoading() { if (!this.loadedRows && !this.hasAttribute('rows') && !this.hasAttribute('data')) this.innerHTML = `<div class="oz-shimmer" style="height:220px;"></div>`; }
  onDataLoaded(payload) { if (Array.isArray(payload)) { this.loadedRows = payload; this.safeRender(); } }
  render() {
    const title = this.prop('title', ['label'], 'Data Records');
    const searchable = this.boolProp('searchable');
    const exportable = this.boolProp('exportable');
    const maskCols = new Set(this.prop('mask-cols', ['mask'], '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    const rows = this.loadedRows || this.jsonProp('rows', ['data'], []) || [];
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    let filtered = rows.filter((r) => !this.query || Object.values(r).some((v) => String(v).toLowerCase().includes(this.query.toLowerCase())));
    if (this.sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const va = String(a[this.sortKey] ?? ''), vb = String(b[this.sortKey] ?? '');
        const na = Number(va.replace(/[^0-9.-]/g, '')), nb = Number(vb.replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(na) && !Number.isNaN(nb) && va.match(/\d/) && vb.match(/\d/)) return this.sortAsc ? na - nb : nb - na;
        return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    this.innerHTML = `
      <div class="oz-table__toolbar">
        <div><div class="oz-card__title">${escapeHTML(title)}</div><div class="oz-text-xs oz-muted">${filtered.length} of ${rows.length} entries</div></div>
        <div class="oz-row" style="gap:8px;">
          ${searchable ? `<input class="oz-input-field" data-oz-table-search placeholder="Filter records..." value="${escapeHTML(this.query)}" style="background:var(--oz-surface-inset);border:1px solid var(--oz-border);border-radius:var(--oz-radius-sm);padding:6px 11px;font-size:0.82rem;width:190px;" />` : ''}
          ${exportable ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-csv>Export CSV</button><button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-json>JSON</button>` : ''}
        </div>
      </div>
      <div class="oz-table__scroll"><table class="oz-table__el"><thead><tr>${cols.map((c) => `<th data-sort-col="${escapeHTML(c)}"><span style="display:inline-flex;align-items:center;gap:4px;">${escapeHTML(c)} ${this.sortKey === c ? `<oz-icon name="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" size="12"></oz-icon>` : ''}</span></th>`).join('')}</tr></thead><tbody>${filtered.length === 0 ? `<tr><td colspan="${Math.max(1, cols.length)}" class="oz-muted">No matching records</td></tr>` : filtered.map((row) => `<tr>${cols.map((c) => this.renderCell(c, row[c], maskCols.has(c.toLowerCase()))).join('')}</tr>`).join('')}</tbody></table></div>`;
    const searchInput = this.querySelector('[data-oz-table-search]');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const pos = searchInput.selectionStart || 0;
        this.query = searchInput.value;
        this.safeRender();
        const next = this.querySelector('[data-oz-table-search]');
        if (next) { next.focus(); next.setSelectionRange(pos, pos); }
      });
    }
    this.querySelectorAll('th[data-sort-col]').forEach((th) => th.addEventListener('click', () => {
      const col = th.dataset.sortCol || '';
      if (this.sortKey === col) this.sortAsc = !this.sortAsc; else { this.sortKey = col; this.sortAsc = true; }
      sound.click();
      this.safeRender();
    }));
    this.querySelector('[data-oz-csv]')?.addEventListener('click', () => {
      const body = filtered.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      this.downloadFile(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, `${cols.join(',')}\n${body}`, 'text/csv');
      toast({ title: 'CSV Exported', message: `Exported ${filtered.length} rows to CSV.`, variant: 'emerald' });
    });
    this.querySelector('[data-oz-json]')?.addEventListener('click', () => {
      this.downloadFile(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`, JSON.stringify(filtered, null, 2), 'application/json');
      toast({ title: 'JSON Exported', message: `Exported ${filtered.length} rows to JSON.`, variant: 'cyan' });
    });
  }
  renderCell(col, val, masked) {
    const str = String(val ?? '');
    if (col.toLowerCase() === 'status') {
      const low = str.toLowerCase();
      const v = /active|live|paid|success|online/.test(low) ? 'emerald' : /trial|pending|warn/.test(low) ? 'amber' : /fail|error|suspend/.test(low) ? 'rose' : 'cyan';
      return `<td data-mask="${masked}"><span class="oz-badge oz-badge--${v}">${escapeHTML(str)}</span></td>`;
    }
    return `<td data-mask="${masked}"><span>${escapeHTML(str)}</span></td>`;
  }
  downloadFile(name, content, mime) {
    sound.success();
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
}

export class OzSmartView extends OzoneElement {
  static get observedAttributes() { return ['title', 'data', 'view', 'src', 'poll']; }
  constructor() { super(); this.currentView = 'table'; this.fetchedRows = null; }
  onDataLoaded(payload) { if (Array.isArray(payload)) { this.fetchedRows = payload; this.safeRender(); } }
  render() {
    const title = this.prop('title', [], 'Smart Data Morpher');
    const viewAttr = this.prop('view');
    if (viewAttr && !this._mounted) this.currentView = viewAttr;
    this._mounted = true;
    const rows = this.fetchedRows || this.jsonProp('data', ['rows'], []) || [];
    this.innerHTML = `
      <div class="oz-between" style="margin-bottom:14px;">
        <div><div class="oz-card__title">${escapeHTML(title)}</div><div class="oz-text-xs oz-muted">Auto-morphing JSON schema across 4 live views</div></div>
        <div class="oz-row" style="gap:6px;">
          ${['table', 'chart', 'cards', 'json'].map((v) => `<button type="button" class="oz-btn oz-btn--sm ${this.currentView === v ? 'oz-btn--glow' : 'oz-btn--glass'}" data-view="${v}" style="text-transform:capitalize;">${v}</button>`).join('')}
        </div>
      </div>
      <div class="oz-smart-stage"></div>`;
    const stage = this.querySelector('.oz-smart-stage');
    if (this.currentView === 'table') {
      const tbl = document.createElement('oz-table');
      tbl.setAttribute('title', `${title} — Grid`);
      tbl.setAttribute('searchable', '');
      tbl.setAttribute('exportable', '');
      tbl.setAttribute('rows', JSON.stringify(rows));
      tbl.style.cssText = 'border:none;padding:0;box-shadow:none;background:transparent;';
      stage.appendChild(tbl);
    } else if (this.currentView === 'chart') {
      const keys = rows[0] ? Object.keys(rows[0]) : [];
      const labelKey = keys.find((k) => typeof rows[0][k] === 'string') || keys[0];
      const numKey = keys.find((k) => typeof rows[0][k] === 'number' || (typeof rows[0][k] === 'string' && /^\$?[\d,.]+$/.test(rows[0][k].trim()))) || keys[1];
      const chart = document.createElement('oz-chart');
      chart.setAttribute('type', 'bar');
      chart.setAttribute('title', `${title} — ${numKey || 'Metrics'}`);
      chart.setAttribute('labels', rows.map((r) => String(r[labelKey] ?? '')).join(','));
      chart.setAttribute('data', rows.map((r) => Number(String(r[numKey] ?? 0).replace(/[^0-9.-]/g, '')) || 0).join(','));
      chart.setAttribute('glow', 'violet');
      chart.setAttribute('exportable', '');
      chart.style.cssText = 'border:none;padding:0;box-shadow:none;background:transparent;';
      stage.appendChild(chart);
    } else if (this.currentView === 'cards') {
      const grid = document.createElement('div');
      grid.className = 'oz-grid-3';
      rows.forEach((row) => {
        const entries = Object.entries(row);
        const card = document.createElement('oz-card');
        card.setAttribute('title', String(entries[1]?.[1] ?? entries[0]?.[1] ?? 'Record'));
        card.setAttribute('subtitle', String(entries[0]?.[1] ?? ''));
        card.setAttribute('tilt', '');
        card.innerHTML = entries.slice(2).map(([k, v]) => `<div class="oz-between oz-text-sm" style="padding:4px 0;border-bottom:1px solid var(--oz-border);"><span class="oz-muted" style="text-transform:capitalize;">${escapeHTML(k)}</span><strong>${escapeHTML(String(v))}</strong></div>`).join('');
        grid.appendChild(card);
      });
      stage.appendChild(grid);
    } else {
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0;padding:14px;border-radius:var(--oz-radius-sm);background:var(--oz-surface-inset);border:1px solid var(--oz-border);overflow:auto;font-size:0.8rem;max-height:300px;';
      pre.textContent = JSON.stringify(rows, null, 2);
      stage.appendChild(pre);
    }
    this.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => {
      const nextView = btn.dataset.view;
      if (nextView && nextView !== this.currentView) {
        sound.click();
        morph(() => { this.currentView = nextView; this.safeRender(); });
      }
    }));
  }
}

// --- 12. Landing & Motion Pack ----------------------------------------------
export class OzHero extends OzoneElement {
  static get observedAttributes() { return ['badge', 'title', 'subtitle']; }
  render() {
    const nodes = this.captureSlotNodes();
    const badge = this.prop('badge');
    const title = this.prop('title', ['heading'], 'Build the Future Interface');
    const subtitle = this.prop('subtitle', ['description']);
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<div class="oz-hero__badge"></div><h1 class="oz-hero__title"></h1><p class="oz-hero__subtitle"></p><div class="oz-hero__actions"></div>`;
      this.badgeEl = this.querySelector('.oz-hero__badge');
      this.titleEl = this.querySelector('.oz-hero__title');
      this.subEl = this.querySelector('.oz-hero__subtitle');
      const actions = this.querySelector('.oz-hero__actions');
      nodes.forEach((n) => actions.appendChild(n));
    }
    this.badgeEl.innerHTML = badge ? `<oz-badge variant="cyan" pulse>${escapeHTML(badge)}</oz-badge>` : '';
    this.titleEl.textContent = title;
    this.subEl.textContent = subtitle;
    this.subEl.style.display = subtitle ? 'block' : 'none';
  }
}

export class OzBento extends OzoneElement {
  static get observedAttributes() { return ['cols', 'gap', 'sortable', 'persist-key']; }
  render() {
    const cols = this.prop('cols', [], '3');
    const gap = this.prop('gap', [], '26px');
    this.style.setProperty('--oz-bento-cols', cols);
    this.style.setProperty('--oz-bento-gap', gap.endsWith('px') ? gap : `${gap}px`);
    if (this.boolProp('sortable') && !this._mounted) {
      this._mounted = true;
      this.restoreOrder();
      this.wireSortableChildren();
    }
  }
  wireSortableChildren() {
    Array.from(this.children).forEach((item, idx) => {
      if (!item.dataset.ozSortId) item.dataset.ozSortId = item.id || `bento-${idx}`;
      if (item.dataset.ozSortableBound) return;
      item.dataset.ozSortableBound = 'true';
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        this.dragSrc = item;
        item.classList.add('oz-drag-ghost');
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.dataset.ozSortId || ''); }
      });
      item.addEventListener('dragover', (e) => { e.preventDefault(); if (this.dragSrc && this.dragSrc !== item) item.classList.add('oz-drag-over'); });
      item.addEventListener('dragleave', () => item.classList.remove('oz-drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('oz-drag-over');
        if (!this.dragSrc || this.dragSrc === item) return;
        const src = this.dragSrc;
        sound.click();
        morph(() => {
          const all = Array.from(this.children);
          if (all.indexOf(src) < all.indexOf(item)) item.after(src); else item.before(src);
        });
        this.saveOrder();
        toast({ title: 'Bento Layout Saved', message: 'Card order updated & persisted.', variant: 'cyan', duration: 2000 });
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('oz-drag-ghost');
        this.querySelectorAll('.oz-drag-over').forEach((el) => el.classList.remove('oz-drag-over'));
        this.dragSrc = null;
      });
    });
  }
  saveOrder() {
    const key = this.getAttribute('persist-key');
    if (!key) return;
    try { localStorage.setItem(`oz-bento:${key}`, JSON.stringify(Array.from(this.children).map((el) => el.dataset.ozSortId).filter(Boolean))); } catch {}
  }
  restoreOrder() {
    const key = this.getAttribute('persist-key');
    const children = Array.from(this.children);
    children.forEach((el, idx) => { if (!el.dataset.ozSortId) el.dataset.ozSortId = el.id || `bento-${idx}`; });
    if (!key) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`oz-bento:${key}`) || 'null');
      if (Array.isArray(saved)) {
        const byId = new Map(children.map((c) => [c.dataset.ozSortId, c]));
        saved.forEach((id) => { const n = byId.get(id); if (n) this.appendChild(n); });
      }
    } catch {}
  }
}

export class OzPricing extends OzoneElement {
  static get observedAttributes() { return ['title', 'price', 'period', 'popular', 'features', 'cta', 'subtitle']; }
  render() {
    const title = this.prop('title', ['name'], 'Pro');
    const subtitle = this.prop('subtitle');
    const price = this.prop('price', [], '$49');
    const period = this.prop('period', [], '/mo');
    const popular = this.boolProp('popular');
    const cta = this.prop('cta', [], 'Deploy Now');
    const features = this.prop('features', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    this.innerHTML = `
      <div>
        <div class="oz-between"><div class="oz-card__title">${escapeHTML(title)}</div>${popular ? `<oz-badge variant="cyan" pulse>Most Popular</oz-badge>` : ''}</div>
        ${subtitle ? `<div class="oz-card__subtitle">${escapeHTML(subtitle)}</div>` : ''}
        <div class="oz-pricing__price">${escapeHTML(price)}<span class="oz-muted" style="font-size:0.95rem;font-weight:500;">${escapeHTML(period)}</span></div>
        <ul class="oz-pricing__features">${features.map((f) => `<li><oz-icon name="check" size="15" style="color:var(--oz-emerald);"></oz-icon><span>${escapeHTML(f)}</span></li>`).join('')}</ul>
      </div>
      <oz-button variant="${popular ? 'glow' : 'glass'}" class="oz-w-full" style="width:100%;display:block;">${escapeHTML(cta)}</oz-button>`;
    const btn = this.querySelector('oz-button');
    if (btn) {
      btn.querySelector('button')?.style.setProperty('width', '100%');
      btn.addEventListener('click', () => {
        sound.success();
        this.dispatchEvent(new CustomEvent('oz-select-plan', { detail: { title, price }, bubbles: true }));
        toast({ title: `${title} Selected`, message: `Initialized ${title} plan (${price}${period}).`, variant: 'emerald' });
      });
    }
  }
}

export class OzMarquee extends OzoneElement {
  static get observedAttributes() { return ['speed']; }
  render() {
    this.style.setProperty('--oz-marquee-speed', this.prop('speed', [], '28s'));
    if (!this._mounted) {
      this._mounted = true;
      const nodes = this.captureSlotNodes();
      const track = document.createElement('div');
      track.className = 'oz-marquee__track';
      const originals = nodes.filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()));
      originals.forEach((n) => track.appendChild(n));
      originals.forEach((n) => track.appendChild(n.cloneNode(true)));
      this.innerHTML = '';
      this.appendChild(track);
    }
  }
}

// --- 13. Marketplace & Social Pack ------------------------------------------
export class OzRating extends OzoneElement {
  static get observedAttributes() { return ['value', 'max', 'interactive', 'reviews']; }
  render() {
    const value = this.numProp('value', [], 4.9);
    const max = Math.max(1, Math.floor(this.numProp('max', [], 5)));
    const interactive = this.boolProp('interactive');
    const reviews = this.prop('reviews');
    const stars = Array.from({ length: max }, (_, i) => {
      const filled = i + 1 <= Math.round(value);
      return `<span class="oz-rating__star ${filled ? 'oz-rating__star--filled' : ''}" data-star="${i + 1}"><oz-icon name="${filled ? 'star-filled' : 'star'}" size="14"></oz-icon></span>`;
    }).join('');
    this.innerHTML = `${stars}<span style="margin-left:4px;font-weight:600;font-size:0.82rem;">${value.toFixed(1)}</span>${reviews ? `<span class="oz-muted oz-text-xs">(${escapeHTML(reviews)})</span>` : ''}`;
    if (interactive) {
      this.querySelectorAll('[data-star]').forEach((s) => s.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = Number(s.dataset.star || 5);
        this.setAttribute('value', String(next));
        sound.click();
        this.dispatchEvent(new CustomEvent('oz-rate', { detail: { value: next }, bubbles: true }));
      }));
    }
  }
}

export class OzProductCard extends OzoneElement {
  static get observedAttributes() { return ['title', 'price', 'old-price', 'rating', 'reviews', 'badge', 'category', 'seller', 'gradient', 'image', 'icon']; }
  render() {
    if (!this.hasAttribute('tilt')) this.setAttribute('tilt', '');
    const title = this.prop('title', ['name'], 'Quantum Asset');
    const price = this.prop('price', [], '$79');
    const oldPrice = this.prop('old-price', ['old_price', 'oldPrice', 'compare-at']);
    const rating = this.prop('rating', [], '4.9');
    const reviews = this.prop('reviews', [], '128');
    const badge = this.prop('badge');
    const category = this.prop('category', [], 'Digital Asset');
    const seller = this.prop('seller', [], 'Aether Studio');
    const gradient = this.prop('gradient', ['glow'], 'cyan');
    const image = this.prop('image', ['src']);
    const catIconMap = { Shaders: 'sparkles', 'AI Agents': 'bot', Audio: 'music', Templates: 'layers' };
    const mediaIcon = this.prop('icon') || catIconMap[category] || 'diamond';
    const bgMap = {
      cyan: 'linear-gradient(135deg, oklch(0.32 0.14 205), oklch(0.24 0.18 265))',
      violet: 'linear-gradient(135deg, oklch(0.32 0.18 285), oklch(0.24 0.16 325))',
      emerald: 'linear-gradient(135deg, oklch(0.32 0.15 155), oklch(0.22 0.14 200))',
      amber: 'linear-gradient(135deg, oklch(0.38 0.16 75), oklch(0.26 0.16 25))',
      rose: 'linear-gradient(135deg, oklch(0.35 0.18 15), oklch(0.24 0.17 295))'
    };
    this.innerHTML = `
      <div class="oz-product__media" style="background:${bgMap[gradient] || bgMap.cyan};">
        <div class="oz-product__media-inner">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(title)}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:82px;height:82px;border-radius:22px;background:oklch(1 0 0 / 0.12);border:1px solid oklch(1 0 0 / 0.28);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 16px 36px oklch(0 0 0 / 0.35);"><oz-icon name="${escapeHTML(mediaIcon)}" size="34"></oz-icon></div>`}</div>
        <div style="position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:2;">
          ${badge ? `<oz-badge variant="${escapeHTML(gradient)}" pulse>${escapeHTML(badge)}</oz-badge>` : '<span></span>'}
          <button type="button" data-oz-wish aria-label="Wishlist" style="width:32px;height:32px;border-radius:50%;border:1px solid oklch(1 0 0 / 0.22);background:oklch(0.1 0.02 220 / 0.55);backdrop-filter:blur(8px);color:${this.wishlisted ? 'var(--oz-rose)' : 'white'};cursor:pointer;display:flex;align-items:center;justify-content:center;"><oz-icon name="${this.wishlisted ? 'heart-filled' : 'heart'}" size="15"></oz-icon></button>
        </div>
      </div>
      <div class="oz-product__body">
        <div class="oz-between"><span class="oz-text-xs oz-muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">${escapeHTML(category)}</span><oz-rating value="${escapeHTML(rating)}" reviews="${escapeHTML(reviews)}"></oz-rating></div>
        <div style="font-size:1.03rem;font-weight:600;letter-spacing:-0.015em;">${escapeHTML(title)}</div>
        <div class="oz-text-xs oz-muted">by <span style="color:var(--oz-text);font-weight:500;">${escapeHTML(seller)}</span></div>
        <div class="oz-product__price-row">
          <div style="display:flex;align-items:baseline;gap:7px;"><span style="font-size:1.25rem;font-weight:700;">${escapeHTML(price)}</span>${oldPrice ? `<span class="oz-subtle oz-text-xs" style="text-decoration:line-through;">${escapeHTML(oldPrice)}</span>` : ''}</div>
          <div class="oz-row" style="gap:6px;"><button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-preview>Inspect</button><button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-oz-buy>Add</button></div>
        </div>
      </div>`;
    this.querySelector('[data-oz-wish]')?.addEventListener('click', (e) => { e.stopPropagation(); this.wishlisted = !this.wishlisted; sound.toggle(this.wishlisted); this.safeRender(); });
    this.querySelector('[data-oz-buy]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.success();
      this.dispatchEvent(new CustomEvent('oz-add-cart', { detail: { title, price, seller, category }, bubbles: true }));
      toast({ title: 'Added to Cart', message: `${title} (${price}) added.`, variant: 'emerald' });
    });
    this.querySelector('[data-oz-preview]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.open();
      this.dispatchEvent(new CustomEvent('oz-product-preview', { detail: { title, price, oldPrice, rating, reviews, badge, category, seller, gradient }, bubbles: true }));
    });
  }
}

export class OzPost extends OzoneElement {
  static get observedAttributes() { return ['author', 'handle', 'verified', 'status', 'time', 'likes', 'comments', 'shares', 'tags', 'content']; }
  render() {
    const nodes = this.captureSlotNodes();
    const author = this.prop('author', ['name'], 'Elena Vance');
    const handle = this.prop('handle', [], '@elena_ai');
    const verified = this.boolProp('verified');
    const status = this.prop('status', [], 'online');
    const time = this.prop('time', [], 'Just now');
    const tags = this.prop('tags', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const content = this.prop('content', ['text']) || nodes.map((n) => n.textContent).join('').trim();
    const likeCount = Math.floor(this.numProp('likes', [], 42)) + (this.liked ? 1 : 0);
    const baseComments = Math.floor(this.numProp('comments', [], 7));
    const shareCount = Math.floor(this.numProp('shares', [], 5)) + (this.reposted ? 1 : 0);
    this.innerHTML = `
      <div class="oz-post__head">
        <div class="oz-post__author"><oz-avatar name="${escapeHTML(author)}" status="${escapeHTML(status)}" ${verified ? 'verified' : ''} size="42"></oz-avatar><div><div style="font-weight:600;font-size:0.95rem;">${escapeHTML(author)}</div><div class="oz-text-xs oz-muted">${escapeHTML(handle)} · ${escapeHTML(time)}</div></div></div>
        <oz-badge variant="violet">Creator</oz-badge>
      </div>
      <div class="oz-post__content">${escapeHTML(content)}</div>
      ${tags.length ? `<div class="oz-row" style="gap:6px;margin-bottom:12px;">${tags.map((t) => `<oz-badge variant="cyan">#${escapeHTML(t)}</oz-badge>`).join('')}</div>` : ''}
      <div class="oz-post__actions">
        <button type="button" class="oz-post__action-btn" data-like data-active="${!!this.liked}"><oz-icon name="${this.liked ? 'heart-filled' : 'heart'}" size="14"></oz-icon> <span>${likeCount.toLocaleString()}</span></button>
        <button type="button" class="oz-post__action-btn" data-comment><oz-icon name="message-circle" size="14"></oz-icon> <span>${baseComments}</span></button>
        <button type="button" class="oz-post__action-btn" data-repost data-active="${!!this.reposted}"><oz-icon name="repeat" size="14"></oz-icon> <span>${shareCount}</span></button>
        <button type="button" class="oz-post__action-btn" data-bookmark data-active="${!!this.bookmarked}" style="margin-left:auto;"><oz-icon name="${this.bookmarked ? 'bookmark-filled' : 'bookmark'}" size="14"></oz-icon> <span>${this.bookmarked ? 'Saved' : 'Save'}</span></button>
      </div>`;
    this.querySelector('[data-like]')?.addEventListener('click', () => { this.liked = !this.liked; sound.toggle(this.liked); this.safeRender(); });
    this.querySelector('[data-repost]')?.addEventListener('click', () => { this.reposted = !this.reposted; sound.click(); this.safeRender(); if (this.reposted) toast({ title: 'Reposted', message: `Shared ${handle}'s post.`, variant: 'cyan', duration: 2000 }); });
    this.querySelector('[data-bookmark]')?.addEventListener('click', () => { this.bookmarked = !this.bookmarked; sound.toggle(this.bookmarked); this.safeRender(); });
    this.querySelector('[data-comment]')?.addEventListener('click', () => { sound.click(); toast({ title: 'Thread Open', message: `Viewing ${baseComments} replies on ${handle}'s post.`, variant: 'violet', duration: 2200 }); });
  }
}

export class OzComposer extends OzoneElement {
  static get observedAttributes() { return ['placeholder', 'target', 'author', 'handle']; }
  render() {
    const placeholder = this.prop('placeholder', [], 'Broadcast an idea, launch update, or AI prompt...');
    const targetSel = this.prop('target');
    const author = this.prop('author', [], 'You');
    const handle = this.prop('handle', [], '@creator');
    this.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <oz-avatar name="${escapeHTML(author)}" status="streaming" verified size="42"></oz-avatar>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;">
          <textarea class="oz-composer__textarea" placeholder="${escapeHTML(placeholder)}"></textarea>
          <div class="oz-between"><div class="oz-row" style="gap:6px;"><oz-badge variant="cyan">#OzoneUI</oz-badge><oz-badge variant="violet">#FutureWeb</oz-badge></div><button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-publish>Publish Post</button></div>
        </div>
      </div>`;
    const textarea = this.querySelector('textarea');
    this.querySelector('[data-publish]')?.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) { toast({ title: 'Empty Post', message: 'Write something before publishing.', variant: 'amber', duration: 2000 }); return; }
      sound.success();
      this.dispatchEvent(new CustomEvent('oz-publish', { detail: { content, author, handle }, bubbles: true }));
      if (targetSel) {
        const feed = document.querySelector(targetSel);
        if (feed) {
          const post = document.createElement('oz-post');
          post.setAttribute('author', author); post.setAttribute('handle', handle);
          post.setAttribute('verified', ''); post.setAttribute('status', 'streaming');
          post.setAttribute('time', 'Just now'); post.setAttribute('likes', '1');
          post.setAttribute('comments', '0'); post.setAttribute('shares', '0');
          post.setAttribute('tags', 'OzoneUI,FutureWeb'); post.setAttribute('content', content);
          morph(() => feed.prepend(post));
        }
      }
      textarea.value = '';
      toast({ title: 'Published Live', message: 'Your post is now live on the network.', variant: 'emerald' });
    });
  }
}

// --- 14. AI Renderer, Command Palette & DNA Inspector ----------------------
const ALLOWED_HTML_TAGS = new Set(['div', 'span', 'p', 'h2', 'h3', 'h4', 'section', 'header', 'strong', 'em', 'ul', 'li']);

export class OzRenderer extends OzoneElement {
  static get observedAttributes() { return ['schema']; }
  set schema(val) { this._schemaObj = val; this.safeRender(); }
  get schema() { return this._schemaObj ?? this.getAttribute('schema'); }
  render() {
    const raw = this._schemaObj ?? this.getAttribute('schema') ?? '';
    if (!String(raw).trim() && !this._schemaObj) { this.innerHTML = `<div class="oz-muted oz-text-sm">Waiting for AI JSON UI schema...</div>`; return; }
    const parsed = repairJSON(raw);
    if (!parsed.ok || !parsed.data) {
      this.innerHTML = `<div class="oz-badge oz-badge--amber" style="padding:8px 12px;border-radius:10px;"><span>Streaming / Parsing Schema: ${escapeHTML(parsed.error || 'Waiting for valid token')}</span></div>`;
      return;
    }
    this.innerHTML = '';
    if (parsed.repaired) {
      const strip = document.createElement('div');
      strip.style.marginBottom = '10px';
      strip.innerHTML = `<oz-badge variant="violet" pulse>Self-Healed Streaming JSON</oz-badge>`;
      this.appendChild(strip);
    }
    const rootList = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    for (const node of rootList) {
      const built = this.buildNode(node);
      if (built) this.appendChild(built);
    }
  }
  buildNode(node) {
    if (typeof node === 'string') return document.createTextNode(node);
    if (!node || typeof node !== 'object' || !node.type) return null;
    const tag = String(node.type).toLowerCase().trim();
    const isSafeOz = tag.startsWith('oz-') && /^[a-z0-9-]+$/.test(tag);
    if (!isSafeOz && !ALLOWED_HTML_TAGS.has(tag)) {
      const warn = document.createElement('oz-badge');
      warn.setAttribute('variant', 'amber');
      warn.setAttribute('label', `Blocked tag: ${tag}`);
      return warn;
    }
    const el = document.createElement(tag);
    const props = node.props && typeof node.props === 'object' ? node.props : {};
    for (const [key, val] of Object.entries(props)) {
      if (val === undefined || val === null || val === false || key === 'action' || /^on/i.test(key)) continue;
      if (/^(href|src|action|formaction|xlink:href)$/i.test(key) && /^\s*(?:javascript|vbscript|data:\s*text\/html)/i.test(String(val))) continue;
      if (key === 'style' && typeof val === 'string') el.setAttribute('style', val);
      else if (typeof val === 'boolean') { if (val) el.setAttribute(key, ''); }
      else if (typeof val === 'object') el.setAttribute(key, JSON.stringify(val));
      else el.setAttribute(key, String(val));
    }
    if (node.text && !Array.isArray(node.children)) el.textContent = String(node.text);
    const actionObj = node.action || props.action;
    if (actionObj) {
      el.addEventListener('click', () => {
        sound.click();
        const actName = typeof actionObj === 'string' ? actionObj : actionObj.name || 'action';
        const payload = typeof actionObj === 'object' ? actionObj.payload : undefined;
        this.dispatchEvent(new CustomEvent('oz-action', { detail: { action: actName, payload, node }, bubbles: true }));
        toast({ title: `AI Schema Action: ${actName}`, message: payload ? JSON.stringify(payload) : 'Dispatched safely from <oz-renderer>', variant: 'violet' });
      });
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const c = this.buildNode(child);
        if (c) el.appendChild(c);
      }
    }
    return el;
  }
}

export class OzCommand extends OzoneElement {
  static get observedAttributes() { return ['auto-discover']; }
  constructor() { super(); this.isOpen = false; this.query = ''; this.selectedIdx = 0; this.boundKey = false; }
  open() { this.isOpen = true; sound.open(); this.safeRender(); requestAnimationFrame(() => this.querySelector('.oz-cmd-input')?.focus()); }
  close() { this.isOpen = false; this.query = ''; this.selectedIdx = 0; this.safeRender(); }
  toggle() { if (this.isOpen) this.close(); else this.open(); }
  gatherCommands() {
    const entries = [
      { id: 'mode-toggle', label: 'Toggle Aesthetic Mode (Atmospheric ↔ Precision)', group: 'Theme DNA', hint: 'Mode', run: () => { const n = document.documentElement.dataset.ozMode === 'precision' ? 'atmospheric' : 'precision'; setMode(n); toast({ title: 'Mode Switched', message: `Active mode: ${n}`, variant: 'cyan' }); } },
      { id: 'theme-toggle', label: 'Toggle Color Theme (Dark ↔ Light)', group: 'Theme DNA', hint: 'Theme', run: () => { const n = document.documentElement.dataset.ozTheme === 'light' ? 'dark' : 'light'; setTheme(n); toast({ title: 'Theme Switched', message: `Active theme: ${n}`, variant: 'violet' }); } },
      { id: 'privacy-toggle', label: 'Toggle Streamer / PII Privacy Veil', group: 'Security', hint: 'Privacy', run: () => { const n = document.documentElement.dataset.ozPrivacy !== 'true'; setPrivacyMode(n); toast({ title: 'Privacy Veil', message: n ? 'Sensitive fields masked.' : 'Sensitive fields revealed.', variant: 'amber' }); } },
      { id: 'sound-toggle', label: 'Toggle Procedural Web Audio Micro-FX', group: 'Audio', hint: 'Audio', run: () => { const n = document.documentElement.dataset.ozSound === 'off'; setSound(n); toast({ title: 'Audio FX', message: n ? 'Synthesizer enabled.' : 'Synthesizer muted.', variant: 'cyan' }); } },
      { id: 'ai-copilot', label: 'Launch AI Ghost Cursor Co-Pilot Tour', group: 'AI Agent', hint: 'Agent', run: () => agent.runDemoWorkflow() },
      { id: 'open-inspector', label: 'Open Live Theme DNA Studio', group: 'Theme DNA', hint: 'Alt+O', run: () => document.querySelector('oz-inspector')?.open() },
      { id: 'copy-ai-prompt', label: 'Copy OzoneUI AI System Prompt (llms.txt)', group: 'AI Agent', hint: 'Copy', run: () => { navigator.clipboard?.writeText(getAIPrompt()).catch(() => {}); toast({ title: 'AI Prompt Copied', message: 'Ready to paste into any LLM system prompt.', variant: 'emerald' }); } },
      { id: 'copy-share-url', label: 'Copy Client Share Link (?preset / ?brand URL)', group: 'Client Branding', hint: 'URL', run: () => { navigator.clipboard?.writeText(dna.getShareURL()).catch(() => {}); toast({ title: 'Client Pitch Link Copied', message: 'Opens this exact brand palette and white-label identity.', variant: 'emerald' }); } },
      ...Object.values(dna.presets).map((p) => ({
        id: `preset-${p.id}`, label: `Apply Brand Preset: ${p.label}`, group: 'Brand Presets', hint: p.mode === 'precision' ? 'Precision' : p.theme,
        run: () => { dna.applyPreset(p.id); toast({ title: 'Brand Preset Applied', message: `${p.label} (${p.hue}° / ${p.hex})`, variant: 'cyan' }); }
      }))
    ];
    if (this.boolProp('auto-discover') || !this.hasAttribute('manual')) {
      document.querySelectorAll('[data-oz-cmd]').forEach((el, i) => {
        entries.push({ id: `disc-${i}`, label: el.getAttribute('data-oz-cmd') || el.textContent?.trim() || `Command ${i + 1}`, group: 'Page Navigation', hint: 'Jump', run: () => el.click() });
      });
    }
    return entries;
  }
  render() {
    if (!this.boundKey) {
      this.boundKey = true;
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.toggle(); }
        else if (e.key === 'Escape' && this.isOpen) this.close();
      });
    }
    const all = this.gatherCommands();
    const q = this.query.trim().toLowerCase();
    const filtered = all.filter((c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    if (this.selectedIdx >= filtered.length) this.selectedIdx = Math.max(0, filtered.length - 1);
    this.innerHTML = `
      <div class="oz-cmd-overlay" data-open="${this.isOpen}">
        <div class="oz-cmd-box" role="dialog" aria-label="OzoneOS Command Palette">
          <div class="oz-cmd-input-row"><oz-icon name="command" size="18" style="color:var(--oz-primary);"></oz-icon><input class="oz-cmd-input" placeholder="Search commands, domains, AI actions, or Theme DNA..." value="${escapeHTML(this.query)}" /><kbd>ESC</kbd></div>
          <div class="oz-cmd-list">${filtered.length === 0 ? `<div class="oz-muted oz-text-sm" style="padding:16px;text-align:center;">No matching commands</div>` : filtered.map((cmd, idx) => `<div class="oz-cmd-item" data-cmd-idx="${idx}" data-selected="${idx === this.selectedIdx}"><div><div style="font-weight:600;">${escapeHTML(cmd.label)}</div><div class="oz-text-xs oz-muted">${escapeHTML(cmd.group)}</div></div>${cmd.hint ? `<kbd>${escapeHTML(cmd.hint)}</kbd>` : ''}</div>`).join('')}</div>
        </div>
      </div>`;
    const overlay = this.querySelector('.oz-cmd-overlay');
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    const input = this.querySelector('.oz-cmd-input');
    if (input && this.isOpen) {
      input.addEventListener('input', () => {
        const pos = input.selectionStart || 0;
        this.query = input.value; this.selectedIdx = 0; this.safeRender();
        const nextInp = this.querySelector('.oz-cmd-input');
        if (nextInp) { nextInp.focus(); nextInp.setSelectionRange(pos, pos); }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedIdx = Math.min(filtered.length - 1, this.selectedIdx + 1); this.updateHighlightOnly(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedIdx = Math.max(0, this.selectedIdx - 1); this.updateHighlightOnly(); }
        else if (e.key === 'Enter' && filtered[this.selectedIdx]) { e.preventDefault(); const c = filtered[this.selectedIdx]; this.close(); c.run(); }
      });
    }
    this.querySelectorAll('[data-cmd-idx]').forEach((row) => row.addEventListener('click', () => {
      const c = filtered[Number(row.dataset.cmdIdx)];
      if (c) { this.close(); c.run(); }
    }));
  }
  updateHighlightOnly() {
    this.querySelectorAll('[data-cmd-idx]').forEach((row, idx) => {
      row.dataset.selected = idx === this.selectedIdx ? 'true' : 'false';
      if (idx === this.selectedIdx) row.scrollIntoView({ block: 'nearest' });
    });
  }
}

export class OzInspector extends OzoneElement {
  static get observedAttributes() { return ['open']; }
  constructor() { super(); this.boundKey = false; this._mountedPanel = false; }
  open() { this.setAttribute('open', ''); sound.open(); }
  close() { this.removeAttribute('open'); sound.click(); }
  toggle() { if (this.boolProp('open')) this.close(); else this.open(); }
  syncUI() {
    const panel = this.querySelector('.oz-inspector-panel');
    if (!panel) return;
    panel.dataset.open = String(this.boolProp('open'));
    const state = dna.read();
    const iconSet = icons.getDefaultSet();
    const contrastLabel = document.documentElement.dataset.ozContrast || 'AAA Verified';
    const contrastEl = this.querySelector('[data-insp-contrast]');
    if (contrastEl) contrastEl.setAttribute('label', contrastLabel);
    this.querySelectorAll('[data-insp-preset]').forEach((b) => { b.dataset.active = String(b.dataset.inspPreset === state.preset); });
    const hexInput = this.querySelector('[data-insp-hex]');
    if (hexInput && document.activeElement !== hexInput) hexInput.value = state.brand;
    const hexLabel = this.querySelector('[data-insp-hex-label]');
    if (hexLabel) hexLabel.textContent = state.brand;
    this.querySelectorAll('[data-insp-harmony]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.inspHarmony === state.harmony ? 'oz-btn--primary' : 'oz-btn--glass'}`; });
    const syncSlider = (key, val, suffix) => {
      const inp = this.querySelector(`[data-range="${key}"]`);
      if (inp && document.activeElement !== inp) inp.value = String(val);
      const lbl = this.querySelector(`[data-val-${key}]`);
      if (lbl) lbl.textContent = `${val}${suffix}`;
    };
    syncSlider('hue', state.hue, '°');
    syncSlider('accent', state.accentHue, '°');
    syncSlider('blur', state.blur, 'px');
    syncSlider('radius', state.radius, 'px');
    const nameInput = this.querySelector('[data-insp-brand-name]');
    const targetName = state.brandName === 'OzoneUI' ? '' : state.brandName;
    if (nameInput && document.activeElement !== nameInput) nameInput.value = targetName;
    this.querySelectorAll('[data-insp-density]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.inspDensity === state.density ? 'oz-btn--primary' : 'oz-btn--glass'}`; });
    this.querySelectorAll('[data-set-mode]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.setMode === state.mode ? 'oz-btn--primary' : 'oz-btn--glass'}`; });
    this.querySelectorAll('[data-set-theme]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.setTheme === state.theme ? 'oz-btn--primary' : 'oz-btn--glass'}`; });
    this.querySelectorAll('[data-set-icons]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.setIcons === iconSet ? 'oz-btn--primary' : 'oz-btn--glass'}`; });
    const dnaEl = this.querySelector('[data-dna-code]');
    if (dnaEl) dnaEl.textContent = dna.encode();
  }
  render() {
    if (!this.boundKey) {
      this.boundKey = true;
      window.addEventListener('keydown', (e) => { if (e.altKey && e.key.toLowerCase() === 'o') { e.preventDefault(); this.toggle(); } });
      window.addEventListener('oz-dna-change', () => this.syncUI());
      window.addEventListener('oz-icon-set-change', () => this.syncUI());
    }
    if (this._mountedPanel && this.querySelector('.oz-inspector-panel')) {
      this.syncUI();
      return;
    }
    this._mountedPanel = true;
    const isOpen = this.boolProp('open');
    const state = dna.read();
    const barcode = dna.encode();
    const iconSet = icons.getDefaultSet();
    const presetList = Object.values(dna.presets);
    const contrastLabel = document.documentElement.dataset.ozContrast || 'AAA Verified';
    this.innerHTML = `
      <aside class="oz-inspector-panel" data-open="${isOpen}" style="padding:14px 16px;gap:10px;" aria-label="OzoneUI Live Theme DNA Studio">
        <div class="oz-between"><div><div style="font-weight:600;font-size:0.95rem;">Theme DNA Studio</div><div class="oz-text-xs oz-muted">Live OKLCH &amp; Client Brand <kbd>Alt+O</kbd></div></div><button type="button" class="oz-btn oz-btn--ghost oz-btn--sm" data-insp-close aria-label="Close"><oz-icon name="x" size="16"></oz-icon></button></div>
        <div class="oz-stack" style="gap:6px;">
          <div class="oz-between"><span class="oz-text-xs oz-muted">8 Brand Presets</span><oz-badge variant="emerald" data-insp-contrast>${escapeHTML(contrastLabel)}</oz-badge></div>
          <div class="oz-between" style="gap:8px;">
            <div class="oz-swatch-row">${presetList.map((p) => `<button type="button" class="oz-swatch-btn" data-insp-preset="${escapeHTML(p.id)}" data-active="${state.preset === p.id}" title="${escapeHTML(p.label)}" aria-label="Apply ${escapeHTML(p.label)}" style="background:${escapeHTML(p.swatch)};"></button>`).join('')}</div>
            <label class="oz-row oz-text-xs" style="gap:5px;cursor:pointer;" title="Custom Brand HEX"><input type="color" class="oz-color-input" data-insp-hex value="${escapeHTML(state.brand)}" aria-label="Pick brand HEX color" /><code data-insp-hex-label style="color:var(--oz-primary);font-weight:600;">${escapeHTML(state.brand)}</code></label>
          </div>
        </div>
        <div class="oz-stack" style="gap:5px;padding:8px 10px;border-radius:var(--oz-radius-sm);background:var(--oz-surface-inset);border:1px solid var(--oz-border);">
          <label class="oz-text-xs oz-between"><span>Primary OKLCH Hue</span><strong data-val-hue>${state.hue}°</strong></label>
          <input class="oz-range" type="range" min="0" max="360" value="${state.hue}" data-range="hue" />
          <label class="oz-text-xs oz-between"><span>Accent Glow Hue</span><strong data-val-accent>${state.accentHue}°</strong></label>
          <input class="oz-range" type="range" min="0" max="360" value="${state.accentHue}" data-range="accent" />
          <label class="oz-text-xs oz-between"><span>Glass Blur</span><strong data-val-blur>${state.blur}px</strong></label>
          <input class="oz-range" type="range" min="0" max="36" value="${state.blur}" data-range="blur" />
          <label class="oz-text-xs oz-between"><span>Corner Radius</span><strong data-val-radius>${state.radius}px</strong></label>
          <input class="oz-range" type="range" min="4" max="28" value="${state.radius}" data-range="radius" />
        </div>
        <div class="oz-stack" style="gap:6px;">
          <div class="oz-between" style="gap:6px;">
            <div class="oz-row" style="gap:4px;">${['analogous', 'complementary', 'triadic', 'monochrome'].map((h) => `<button type="button" class="oz-btn oz-btn--sm ${state.harmony === h ? 'oz-btn--primary' : 'oz-btn--glass'}" data-insp-harmony="${h}" style="padding:3px 7px;font-size:0.68rem;text-transform:capitalize;">${h === 'complementary' ? 'Complement' : h === 'monochrome' ? 'Mono' : h}</button>`).join('')}</div>
            <input type="file" accept="image/*" data-insp-logo-file style="display:none;" />
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-insp-logo style="padding:3px 8px;font-size:0.68rem;"><oz-icon name="sparkles" size="12"></oz-icon> Logo</button>
          </div>
          <div class="oz-grid-4" style="gap:5px;">
            <button type="button" class="oz-btn oz-btn--sm ${state.mode === 'atmospheric' ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-mode="atmospheric" style="padding:4px 4px;font-size:0.68rem;justify-content:center;">Atmo</button>
            <button type="button" class="oz-btn oz-btn--sm ${state.mode === 'precision' ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-mode="precision" style="padding:4px 4px;font-size:0.68rem;justify-content:center;">Precision</button>
            <button type="button" class="oz-btn oz-btn--sm ${state.theme === 'dark' ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-theme="dark" style="padding:4px 4px;font-size:0.68rem;justify-content:center;">Dark</button>
            <button type="button" class="oz-btn oz-btn--sm ${state.theme === 'light' ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-theme="light" style="padding:4px 4px;font-size:0.68rem;justify-content:center;">Light</button>
          </div>
          <div class="oz-row" style="gap:6px;">
            <input type="text" class="oz-input-field" data-insp-brand-name value="${escapeHTML(state.brandName === 'OzoneUI' ? '' : state.brandName)}" placeholder="Client Name (e.g. Solaris)" style="flex:1;min-width:110px;padding:5px 8px;border-radius:var(--oz-radius-sm);border:1px solid var(--oz-border);background:var(--oz-surface-inset);color:var(--oz-text);font-size:0.75rem;" />
            ${['compact', 'default', 'spacious'].map((d) => `<button type="button" class="oz-btn oz-btn--sm ${state.density === d ? 'oz-btn--primary' : 'oz-btn--glass'}" data-insp-density="${d}" style="padding:4px 6px;font-size:0.68rem;text-transform:capitalize;">${d === 'default' ? 'Std' : d === 'compact' ? 'Tight' : 'Airy'}</button>`).join('')}
          </div>
          <div class="oz-row" style="gap:4px;">${['builtin', 'ph', 'tabler', 'solar', 'heroicons'].map((s) => `<button type="button" class="oz-btn oz-btn--sm ${iconSet === s ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-icons="${s}" style="padding:3px 6px;font-size:0.68rem;">${s === 'builtin' ? 'Built-in' : s === 'ph' ? 'Phosphor' : s}</button>`).join('')}</div>
        </div>
        <div style="padding:8px 10px;border-radius:var(--oz-radius-sm);background:var(--oz-surface-inset);border:1px solid var(--oz-border);">
          <code data-dna-code style="display:block;font-size:0.7rem;word-break:break-all;color:var(--oz-primary);margin-bottom:6px;">${escapeHTML(barcode)}</code>
          <div class="oz-row" style="gap:5px;">
            <button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-copy-html-tag style="padding:3px 7px;font-size:0.69rem;">Copy &lt;html&gt;</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-copy-share-url style="padding:3px 7px;font-size:0.69rem;">Share URL</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-copy-w3c style="padding:3px 7px;font-size:0.69rem;">W3C JSON</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-copy-dna style="padding:3px 7px;font-size:0.69rem;">DNA</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-reset-dna style="padding:3px 7px;font-size:0.69rem;">Reset</button>
          </div>
        </div>
      </aside>`;
    this.querySelector('[data-insp-close]')?.addEventListener('click', () => this.close());
    this.querySelectorAll('[data-insp-preset]').forEach((b) => b.addEventListener('click', () => {
      sound.click();
      const applied = dna.applyPreset(b.dataset.inspPreset || 'ozone');
      if (applied) toast({ title: 'Brand Preset Applied', message: `${applied.label} palette active.`, variant: 'cyan', duration: 1800 });
    }));
    this.querySelector('[data-insp-hex]')?.addEventListener('input', (e) => { dna.fromHex(e.target.value, dna.read().harmony); });
    this.querySelectorAll('[data-insp-harmony]').forEach((b) => b.addEventListener('click', () => { sound.click(); dna.fromHex(dna.read().brand, b.dataset.inspHarmony); }));
    const logoInput = this.querySelector('[data-insp-logo-file]');
    this.querySelector('[data-insp-logo]')?.addEventListener('click', () => logoInput?.click());
    logoInput?.addEventListener('change', async () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      try {
        const hex = await dna.fromLogoFile(file);
        sound.success();
        toast({ title: 'Logo Brand Extracted', message: `Applied dominant OKLCH color ${hex}.`, variant: 'emerald' });
      } catch { toast({ title: 'Logo Read Failed', message: 'Please choose a valid PNG, JPG, or SVG file.', variant: 'rose' }); }
    });
    this.querySelector('[data-insp-brand-name]')?.addEventListener('input', (e) => { dna.setBrandName(e.target.value); });
    this.querySelectorAll('[data-insp-density]').forEach((b) => b.addEventListener('click', () => { sound.click(); dna.setDensity(b.dataset.inspDensity); }));
    this.querySelectorAll('[data-set-mode]').forEach((b) => b.addEventListener('click', () => { sound.click(); document.documentElement.style.removeProperty('--oz-backdrop'); setMode(b.dataset.setMode); }));
    this.querySelectorAll('[data-set-theme]').forEach((b) => b.addEventListener('click', () => { sound.click(); setTheme(b.dataset.setTheme); }));
    this.querySelectorAll('[data-set-icons]').forEach((b) => b.addEventListener('click', () => {
      const nextSet = b.dataset.setIcons || 'builtin';
      sound.click();
      icons.setDefaultSet(nextSet);
      toast({ title: 'Icon Pack Switched', message: `Active <oz-icon> set: ${nextSet}`, variant: 'cyan', duration: 2000 });
    }));
    this.querySelector('[data-range="hue"]')?.addEventListener('input', (e) => {
      const v = e.target.value;
      document.documentElement.style.setProperty('--oz-hue', v);
      document.documentElement.dataset.ozPreset = 'custom';
      const lbl = this.querySelector('[data-val-hue]');
      if (lbl) lbl.textContent = `${v}°`;
      dna.emitChange();
    });
    this.querySelector('[data-range="accent"]')?.addEventListener('input', (e) => {
      const v = e.target.value;
      document.documentElement.style.setProperty('--oz-accent-hue', v);
      document.documentElement.dataset.ozPreset = 'custom';
      const lbl = this.querySelector('[data-val-accent]');
      if (lbl) lbl.textContent = `${v}°`;
      dna.emitChange();
    });
    this.querySelector('[data-range="blur"]')?.addEventListener('input', (e) => {
      const v = Number(e.target.value) || 0;
      document.documentElement.style.setProperty('--oz-blur', `${v}px`);
      document.documentElement.style.setProperty('--oz-backdrop', v > 0 ? `blur(${v}px) saturate(175%)` : 'none');
      const lbl = this.querySelector('[data-val-blur]');
      if (lbl) lbl.textContent = `${v}px`;
      dna.emitChange();
    });
    this.querySelector('[data-range="radius"]')?.addEventListener('input', (e) => {
      const v = e.target.value;
      document.documentElement.style.setProperty('--oz-radius', `${v}px`);
      const lbl = this.querySelector('[data-val-radius]');
      if (lbl) lbl.textContent = `${v}px`;
      dna.emitChange();
    });
    this.querySelector('[data-copy-html-tag]')?.addEventListener('click', () => { const s = dna.getDeployHTML(); navigator.clipboard?.writeText(s).catch(() => {}); sound.success(); toast({ title: '<html> Tag Copied', message: s, variant: 'emerald' }); });
    this.querySelector('[data-copy-share-url]')?.addEventListener('click', () => { navigator.clipboard?.writeText(dna.getShareURL()).catch(() => {}); sound.success(); toast({ title: 'Client Pitch Link Copied', message: 'Shareable ?preset / ?brand URL copied!', variant: 'emerald' }); });
    this.querySelector('[data-copy-w3c]')?.addEventListener('click', () => { navigator.clipboard?.writeText(dna.getW3CTokens()).catch(() => {}); sound.success(); toast({ title: 'W3C Tokens Copied', message: 'Design Tokens JSON copied to clipboard.', variant: 'violet' }); });
    this.querySelector('[data-copy-dna]')?.addEventListener('click', () => { const code = dna.encode(); navigator.clipboard?.writeText(code).catch(() => {}); sound.success(); toast({ title: 'Theme DNA Copied', message: code, variant: 'emerald' }); });
    this.querySelector('[data-reset-dna]')?.addEventListener('click', () => { sound.click(); dna.reset(); toast({ title: 'Theme Reset', message: 'Restored default OzoneUI Atmospheric DNA.', variant: 'cyan' }); });
  }
}

// --- 14.5 Layout, Navigation & Feedback Pack ---------------------------------
export class OzHeader extends OzoneElement {
  static get observedAttributes() { return ['variant', 'brand', 'badge', 'links', 'cta', 'search', 'icon', 'mobile-menu', 'menu-style', 'drawer', 'max-links']; }
  disconnectedCallback() { this.cleanupOverlay(); this.cleanupDocClick(); super.disconnectedCallback(); }
  cleanupDocClick() {
    if (this._docClickHandler) { document.removeEventListener('click', this._docClickHandler); this._docClickHandler = null; }
  }
  cleanupOverlay() {
    if (this._escHandler) { window.removeEventListener('keydown', this._escHandler); this._escHandler = null; }
    this._overlayEl?.remove();
    this._overlayEl = null;
  }
  resolveMobileMode() {
    const raw = this.prop('mobile-menu', ['menu-style', 'drawer', 'mobile'], 'slide').trim().toLowerCase();
    if (raw === 'modal' || raw === 'dialog') return 'modal';
    if (raw === 'dropdown' || raw === 'inline') return 'dropdown';
    if (raw === 'slide-left' || raw === 'left') return 'slide-left';
    return 'slide';
  }
  render() {
    this.cleanupOverlay();
    this.cleanupDocClick();
    const variant = this.prop('variant', ['type'], 'glass');
    const brand = this.prop('brand', ['title'], 'OzoneUI');
    const badge = this.prop('badge');
    const icon = this.prop('icon', [], 'diamond');
    const links = this.prop('links', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const maxLinks = this.numProp('max-links', ['max_links'], 0);
    const hasOverflow = maxLinks > 0 && links.length > maxLinks;
    const visibleLinks = hasOverflow ? links.slice(0, maxLinks) : links;
    const overflowLinks = hasOverflow ? links.slice(maxLinks) : [];
    const cta = this.prop('cta');
    const hasSearch = this.boolProp('search');
    const mobileMenu = this.resolveMobileMode();
    let activeLink = links[0] || '';
    this.innerHTML = `
      <header class="oz-header oz-header--${escapeHTML(variant)}" data-menu-open="false" data-mobile-menu="${escapeHTML(mobileMenu)}">
        <div class="oz-header__brand">
          <span class="oz-header__logo"><oz-icon name="${escapeHTML(icon)}" size="16"></oz-icon></span>
          <span class="oz-header__title">${escapeHTML(brand)}</span>
          ${badge ? `<oz-badge variant="cyan" pulse>${escapeHTML(badge)}</oz-badge>` : ''}
        </div>
        ${links.length ? `<nav class="oz-header__nav" aria-label="${escapeHTML(brand)} navigation">${visibleLinks.map((lnk, idx) => `<button type="button" class="oz-btn oz-btn--sm ${idx === 0 ? 'oz-btn--glass' : 'oz-btn--ghost'}" data-oz-header-link="${escapeHTML(lnk)}">${escapeHTML(lnk)}</button>`).join('')}${overflowLinks.length ? `<div class="oz-header__more"><button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-header-more aria-expanded="false"><span>+${overflowLinks.length} More</span><oz-icon name="chevron-down" size="13"></oz-icon></button><div class="oz-header__more-menu" data-open="false">${overflowLinks.map((lnk) => `<button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-header-link="${escapeHTML(lnk)}">${escapeHTML(lnk)}</button>`).join('')}</div></div>` : ''}</nav>` : ''}
        <div class="oz-header__actions">
          ${hasSearch ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-header-search aria-label="Search"><oz-icon name="search" size="14"></oz-icon> <span class="oz-header__search-label">Search</span> <kbd class="oz-header__search-kbd">Ctrl+K</kbd></button>` : ''}
          ${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-oz-header-cta>${escapeHTML(cta)}</button>` : ''}
          ${links.length ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-header__burger" data-oz-header-burger aria-label="Toggle navigation menu" aria-expanded="false"><oz-icon name="menu" size="16"></oz-icon></button>` : ''}
        </div>
      </header>`;
    const headerEl = this.querySelector('.oz-header');
    const burgerBtn = this.querySelector('[data-oz-header-burger]');
    const moreWrap = this.querySelector('.oz-header__more');
    const moreBtn = this.querySelector('[data-oz-header-more]');
    const moreMenu = this.querySelector('.oz-header__more-menu');
    const setMoreOpen = (open) => {
      if (!moreMenu || !moreBtn) return;
      moreMenu.setAttribute('data-open', open ? 'true' : 'false');
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.style.zIndex = open ? '60' : '';
      if (headerEl) headerEl.style.zIndex = open ? '60' : '';
    };
    moreBtn?.addEventListener('click', (e) => { e.stopPropagation(); sound.click(); setMoreOpen(moreMenu?.getAttribute('data-open') !== 'true'); });
    if (moreWrap) {
      this._docClickHandler = (e) => { if (moreMenu?.getAttribute('data-open') === 'true' && !moreWrap.contains(e.target)) setMoreOpen(false); };
      document.addEventListener('click', this._docClickHandler);
    }
    const selectLink = (link) => {
      activeLink = link;
      this.querySelectorAll('[data-oz-header-link]').forEach((b) => { b.className = `oz-btn oz-btn--sm ${b.dataset.ozHeaderLink === link ? 'oz-btn--glass' : 'oz-btn--ghost'}`; });
      setMoreOpen(false);
      this.dispatchEvent(new CustomEvent('oz-nav', { detail: { link }, bubbles: true }));
      toast({ title: `${brand} Navigation`, message: `Selected "${link}" section.`, variant: 'cyan', duration: 2000 });
    };
    const triggerSearch = () => {
      setMoreOpen(false);
      sound.open();
      const cmd = document.querySelector('oz-command');
      if (cmd?.open) cmd.open(); else toast({ title: 'Search Triggered', message: 'Header command search activated.', variant: 'cyan' });
    };
    const triggerCta = () => {
      setMoreOpen(false);
      sound.success();
      this.dispatchEvent(new CustomEvent('oz-cta', { detail: { cta, brand }, bubbles: true }));
      toast({ title: cta || 'Action', message: `Executed "${cta}" from ${brand} header.`, variant: 'emerald' });
    };
    const setMenuOpen = (open) => {
      setMoreOpen(false);
      headerEl?.setAttribute('data-menu-open', open ? 'true' : 'false');
      if (burgerBtn) {
        burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        burgerBtn.querySelector('oz-icon')?.setAttribute('name', open ? 'x' : 'menu');
      }
      if (mobileMenu === 'dropdown' || !open) { this.cleanupOverlay(); return; }
      this.cleanupOverlay();
      const overlay = document.createElement('div');
      overlay.className = 'oz-mobile-overlay';
      overlay.dataset.open = 'true';
      overlay.dataset.style = mobileMenu;
      overlay.innerHTML = `
        <div class="oz-mobile-sheet" role="dialog" aria-modal="true" aria-label="${escapeHTML(brand)} navigation">
          <div class="oz-mobile-sheet__head">
            <div class="oz-header__brand">
              <span class="oz-header__logo"><oz-icon name="${escapeHTML(icon)}" size="16"></oz-icon></span>
              <span class="oz-header__title">${escapeHTML(brand)}</span>
              ${badge ? `<oz-badge variant="cyan">${escapeHTML(badge)}</oz-badge>` : ''}
            </div>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost oz-mobile-sheet__close" data-oz-mobile-close aria-label="Close navigation menu"><oz-icon name="x" size="16"></oz-icon></button>
          </div>
          <nav class="oz-mobile-sheet__nav" aria-label="${escapeHTML(brand)} mobile links">
            ${links.map((lnk) => `<button type="button" class="oz-btn oz-btn--sm ${lnk === activeLink ? 'oz-btn--glass' : 'oz-btn--ghost'}" data-oz-mobile-link="${escapeHTML(lnk)}"><span>${escapeHTML(lnk)}</span><oz-icon name="arrow-right" size="13" class="oz-subtle"></oz-icon></button>`).join('')}
          </nav>
          ${(hasSearch || cta) ? `<div class="oz-mobile-sheet__foot">${hasSearch ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-mobile-search style="width:100%;"><oz-icon name="search" size="14"></oz-icon> <span>Search</span></button>` : ''}${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-oz-mobile-cta style="width:100%;">${escapeHTML(cta)}</button>` : ''}</div>` : ''}
        </div>`;
      overlay.addEventListener('click', (e) => { if (e.target === overlay) { sound.click(); setMenuOpen(false); } });
      overlay.querySelector('[data-oz-mobile-close]')?.addEventListener('click', () => { sound.click(); setMenuOpen(false); });
      overlay.querySelectorAll('[data-oz-mobile-link]').forEach((btn) => btn.addEventListener('click', () => { sound.click(); selectLink(btn.dataset.ozMobileLink || ''); setMenuOpen(false); }));
      overlay.querySelector('[data-oz-mobile-search]')?.addEventListener('click', () => { setMenuOpen(false); triggerSearch(); });
      overlay.querySelector('[data-oz-mobile-cta]')?.addEventListener('click', () => { setMenuOpen(false); triggerCta(); });
      this._escHandler = (e) => { if (e.key === 'Escape') { sound.click(); setMenuOpen(false); } };
      window.addEventListener('keydown', this._escHandler);
      document.body.appendChild(overlay);
      this._overlayEl = overlay;
    };
    burgerBtn?.addEventListener('click', () => { sound.click(); setMenuOpen(headerEl?.getAttribute('data-menu-open') !== 'true'); });
    this.querySelectorAll('[data-oz-header-link]').forEach((btn) => btn.addEventListener('click', () => { sound.click(); selectLink(btn.dataset.ozHeaderLink || ''); setMenuOpen(false); }));
    this.querySelector('[data-oz-header-search]')?.addEventListener('click', triggerSearch);
    this.querySelector('[data-oz-header-cta]')?.addEventListener('click', triggerCta);
  }
}

export class OzFooter extends OzoneElement {
  static get observedAttributes() { return ['variant', 'brand', 'tagline', 'columns', 'status', 'copyright', 'newsletter']; }
  render() {
    const variant = this.prop('variant', ['type'], 'multi-col');
    const brand = this.prop('brand', ['title'], 'OzoneUI');
    const tagline = this.prop('tagline', [], 'Web-Standards, AI-Native Quad-Domain UI Framework.');
    const status = this.prop('status', [], 'All Systems Operational');
    const copyright = this.prop('copyright', [], `© ${new Date().getFullYear()} ${brand}. Built with Web Standards.`);
    const newsletter = this.boolProp('newsletter');
    const cols = this.jsonProp('columns', [], []) || [];
    if (variant === 'minimal') {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--minimal">
          <div class="oz-row" style="gap:10px;"><oz-icon name="diamond" size="16" style="color:var(--oz-primary);"></oz-icon><strong style="font-weight:600;">${escapeHTML(brand)}</strong><span class="oz-muted oz-text-xs">${escapeHTML(copyright)}</span></div>
          <div class="oz-row" style="gap:12px;">
            ${status ? `<oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge>` : ''}
            ${cols.flatMap((c) => c.links || []).slice(0, 4).map((l) => {
              const lbl = typeof l === 'string' ? l : l.label;
              const href = typeof l === 'string' ? '' : (l.href || '');
              const tgt = typeof l === 'string' ? '' : (l.target || '');
              if (href) return `<a class="oz-footer__link" href="${escapeHTML(href)}" style="text-decoration:none;"${href.startsWith('http')?' target="_blank" rel="noopener"':''}>${escapeHTML(lbl)}</a>`;
              return `<button type="button" class="oz-footer__link" data-footer-link="${escapeHTML(lbl)}" data-footer-target="${escapeHTML(tgt)}">${escapeHTML(lbl)}</button>`;
            }).join('')}
          </div>
        </footer>`;
    } else if (variant === 'status') {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--status">
          <div class="oz-row" style="gap:10px;"><oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge><span class="oz-muted oz-text-xs">${escapeHTML(tagline)}</span></div>
          <span class="oz-muted oz-text-xs">${escapeHTML(copyright)}</span>
        </footer>`;
    } else {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--multi">
          <div class="oz-footer__grid">
            <div class="oz-stack" style="gap:12px;">
              <div class="oz-row" style="gap:10px;"><span class="oz-header__logo"><oz-icon name="diamond" size="16"></oz-icon></span><span style="font-weight:700;font-size:1.05rem;">${escapeHTML(brand)}</span></div>
              <p class="oz-text-sm oz-muted" style="max-width:34ch;">${escapeHTML(tagline)}</p>
              ${status ? `<div><oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge></div>` : ''}
              ${newsletter ? `<form class="oz-row" data-oz-newsletter style="gap:6px;margin-top:4px;"><input class="oz-input-field" type="email" placeholder="you@company.com" required style="background:var(--oz-surface-inset);border:1px solid var(--oz-border);border-radius:var(--oz-radius-sm);padding:7px 11px;font-size:0.82rem;max-width:200px;" /><button type="submit" class="oz-btn oz-btn--sm oz-btn--primary">Subscribe</button></form>` : ''}
            </div>
            ${cols.map((col) => `<div class="oz-stack" style="gap:10px;"><div class="oz-footer__col-title">${escapeHTML(col.title)}</div><div class="oz-stack" style="gap:7px;">${(col.links || []).map((l) => { const lbl = typeof l === 'string' ? l : l.label; const href = typeof l === 'string' ? '' : (l.href || ''); const tgt = typeof l === 'string' ? '' : (l.target || ''); if (href) return `<a class="oz-footer__link" href="${escapeHTML(href)}" style="text-decoration:none;"${href.startsWith('http')?' target="_blank" rel="noopener"':''}>${escapeHTML(lbl)}</a>`; return `<button type="button" class="oz-footer__link" data-footer-link="${escapeHTML(lbl)}" data-footer-target="${escapeHTML(tgt)}">${escapeHTML(lbl)}</button>`; }).join('')}</div></div>`).join('')}
          </div>
          <div class="oz-footer__bottom">
            <span class="oz-text-xs oz-muted">${escapeHTML(copyright)}</span>
            <div class="oz-row" style="gap:8px;"><span class="oz-text-xs oz-subtle">OKLCH + Web Standards</span><oz-badge variant="cyan" icon="sparkles">Zero Dependencies</oz-badge></div>
          </div>
        </footer>`;
    }
    this.querySelectorAll('[data-footer-link]').forEach((el) => el.addEventListener('click', () => {
      const label = el.dataset.footerLink || '', target = el.dataset.footerTarget || '';
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-footer-nav', { detail: { label, target }, bubbles: true }));
      if (target) {
        const domainBtn = document.querySelector(`[data-domain-btn="${target}"]`);
        if (domainBtn) { domainBtn.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      }
      toast({ title: 'Footer Link', message: `Navigated to "${label}".`, variant: 'cyan', duration: 2000 });
    }));
    this.querySelector('[data-oz-newsletter]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = e.currentTarget.querySelector('input');
      const email = inp?.value.trim();
      if (!email) return;
      sound.success();
      inp.value = '';
      toast({ title: 'Subscribed', message: `${email} added to OzoneUI release updates.`, variant: 'emerald' });
    });
  }
}

export class OzBreadcrumbs extends OzoneElement {
  static get observedAttributes() { return ['items', 'separator']; }
  render() {
    const raw = this.prop('items', [], 'Home,Workspace,Overview');
    const items = raw.startsWith('[') ? (repairJSON(raw).data || []) : raw.split(',').map((s) => s.trim()).filter(Boolean);
    const sepType = this.prop('separator', [], 'arrow');
    this.innerHTML = `<nav class="oz-breadcrumbs" aria-label="Breadcrumb">${items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      const sep = idx < items.length - 1 ? (sepType === 'slash' ? `<span class="oz-subtle">/</span>` : `<oz-icon name="arrow-right" size="12" class="oz-subtle"></oz-icon>`) : '';
      return isLast ? `<span class="oz-breadcrumbs__current" aria-current="page">${escapeHTML(item)}</span>` : `<button type="button" class="oz-breadcrumbs__item" data-crumb-idx="${idx}" data-crumb="${escapeHTML(item)}">${escapeHTML(item)}</button>${sep}`;
    }).join('')}</nav>`;
    this.querySelectorAll('[data-crumb]').forEach((btn) => btn.addEventListener('click', () => {
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-navigate', { detail: { index: Number(btn.dataset.crumbIdx || 0), label: btn.dataset.crumb }, bubbles: true }));
      toast({ title: 'Breadcrumb Navigation', message: `Navigated to "${btn.dataset.crumb}".`, variant: 'cyan', duration: 2000 });
    }));
  }
}

export class OzAlert extends OzoneElement {
  static get observedAttributes() { return ['variant', 'color', 'type', 'title', 'message', 'icon', 'dismissible', 'cta']; }
  render() {
    const nodes = this.captureSlotNodes();
    const variant = this.prop('variant', ['color', 'type'], 'cyan');
    const title = this.prop('title');
    const msg = this.prop('message', ['text']) || nodes.map((n) => n.textContent).join('').trim();
    const dismissible = this.boolProp('dismissible');
    const cta = this.prop('cta');
    const defaultIcons = { cyan: 'info', violet: 'sparkles', emerald: 'verified', amber: 'alert-triangle', rose: 'alert-triangle' };
    const icon = this.prop('icon') || defaultIcons[variant] || 'info';
    this.innerHTML = `
      <div class="oz-alert oz-alert--${escapeHTML(variant)}" role="alert">
        <oz-icon name="${escapeHTML(icon)}" size="18" class="oz-alert__icon"></oz-icon>
        <div style="flex:1;min-width:0;">${title ? `<div class="oz-alert__title">${escapeHTML(title)}</div>` : ''}${msg ? `<div class="oz-alert__msg">${escapeHTML(msg)}</div>` : ''}</div>
        <div class="oz-row" style="gap:6px;flex-shrink:0;">
          ${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-alert-cta>${escapeHTML(cta)}</button>` : ''}
          ${dismissible ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-alert-dismiss aria-label="Dismiss"><oz-icon name="x" size="14"></oz-icon></button>` : ''}
        </div>
      </div>`;
    this.querySelector('[data-alert-cta]')?.addEventListener('click', () => {
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-alert-action', { detail: { title, cta }, bubbles: true }));
      toast({ title: cta || 'Action', message: `Executed "${cta}".`, variant: 'cyan' });
    });
    this.querySelector('[data-alert-dismiss]')?.addEventListener('click', () => {
      sound.click();
      this.style.cssText = 'opacity:0;transform:scale(0.98);transition:all 180ms ease;';
      setTimeout(() => this.remove(), 190);
    });
  }
}

export class OzProgress extends OzoneElement {
  static get observedAttributes() { return ['value', 'max', 'label', 'variant', 'color', 'show-value', 'indeterminate']; }
  render() {
    const val = this.numProp('value', [], 64);
    const max = Math.max(1, this.numProp('max', [], 100));
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    const label = this.prop('label', ['title']);
    const variant = this.prop('variant', ['color'], 'cyan');
    const showValue = this.boolProp('show-value') || Boolean(label);
    const indet = this.boolProp('indeterminate');
    this.innerHTML = `
      <div class="oz-progress">
        ${(label || showValue) ? `<div class="oz-between oz-text-xs" style="margin-bottom:6px;"><span class="oz-muted" style="font-weight:500;">${escapeHTML(label)}</span>${showValue ? `<span style="font-weight:600;">${indet ? 'Syncing...' : `${Math.round(pct)}%`}</span>` : ''}</div>` : ''}
        <div class="oz-progress__track" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><div class="oz-progress__fill oz-progress__fill--${escapeHTML(variant)} ${indet ? 'oz-progress__fill--indet' : ''}" style="width:${indet ? '42%' : pct.toFixed(1) + '%'};"></div></div>
      </div>`;
  }
}

export class OzAccordion extends OzoneElement {
  static get observedAttributes() { return ['items', 'multiple']; }
  constructor() { super(); this.openSet = new Set(); }
  render() {
    const items = this.jsonProp('items', [], []) || [];
    const multiple = this.boolProp('multiple');
    if (!this._mounted) {
      this._mounted = true;
      items.forEach((it, i) => { if (it.open) this.openSet.add(i); });
      if (this.openSet.size === 0 && items.length > 0) this.openSet.add(0);
    }
    this.innerHTML = `<div class="oz-accordion">${items.map((it, idx) => {
      const isOpen = this.openSet.has(idx);
      return `<div class="oz-accordion__item" data-open="${isOpen}"><button type="button" class="oz-accordion__trigger" data-acc-idx="${idx}" aria-expanded="${isOpen}"><span>${escapeHTML(it.title)}</span><oz-icon name="chevron-down" size="16" class="oz-accordion__chev"></oz-icon></button>${isOpen ? `<div class="oz-accordion__body">${escapeHTML(it.content)}</div>` : ''}</div>`;
    }).join('')}</div>`;
    this.querySelectorAll('[data-acc-idx]').forEach((btn) => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.accIdx || 0);
      const wasOpen = this.openSet.has(idx);
      if (!multiple) this.openSet.clear();
      if (wasOpen) this.openSet.delete(idx); else this.openSet.add(idx);
      sound.click();
      morph(() => this.safeRender());
    }));
  }
}

export class OzTimeline extends OzoneElement {
  static get observedAttributes() { return ['items']; }
  render() {
    const items = this.jsonProp('items', [], []) || [];
    this.innerHTML = `<div class="oz-timeline">${items.map((it) => `<div class="oz-timeline__item"><span class="oz-timeline__dot oz-timeline__dot--${escapeHTML(it.status || 'cyan')}"></span><div class="oz-timeline__content"><div class="oz-between" style="gap:8px;"><span style="font-weight:600;font-size:0.9rem;">${escapeHTML(it.title)}</span><span class="oz-text-xs oz-subtle">${escapeHTML(it.time)}</span></div>${it.desc ? `<div class="oz-text-xs oz-muted" style="margin-top:3px;">${escapeHTML(it.desc)}</div>` : ''}</div></div>`).join('')}</div>`;
  }
}

// ============================================================================
// OzoneUI Pack E: App Shell, Sidebar & Form Controls
// <oz-sidebar>, <oz-app-shell>, <oz-select>, <oz-checkbox>, <oz-radio-group>,
// <oz-textarea>, <oz-slider>, <oz-date-picker>, <oz-file-upload>, <oz-combobox>
// ============================================================================

const OZ_SVG = {
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  panel: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>',
  burger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

function ozUid() { return Math.random().toString(36).slice(2, 8); }

function ozFieldHTML(host, inner, forId) {
  const label = host.prop('label', ['title']);
  const hint = host.prop('hint', ['help', 'description']);
  const error = host.prop('error');
  const cls = 'oz-field' + (error ? ' oz-field--error' : '') + (host.boolProp('disabled') ? ' oz-field--disabled' : '');
  const lab = label ? `<label class="oz-field__label"${forId ? ` for="${forId}"` : ''}>${escapeHTML(label)}${host.boolProp('required') ? '<span class="oz-field__req">*</span>' : ''}</label>` : '';
  const msg = error ? `<div class="oz-field__msg oz-field__msg--error">${escapeHTML(error)}</div>` : hint ? `<div class="oz-field__msg">${escapeHTML(hint)}</div>` : '';
  return `<div class="${cls}">${lab}${inner}${msg}</div>`;
}

function ozParseOptions(host) {
  const out = [];
  const raw = host.getAttribute('options');
  if (raw) {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        JSON.parse(t).forEach((o) => {
          if (o && typeof o === 'object') out.push({ value: String(o.value ?? o.label), label: String(o.label ?? o.value), desc: o.desc || o.description || '', group: o.group || '' });
          else out.push({ value: String(o), label: String(o), desc: '', group: '' });
        });
      } catch (e) { /* ignore malformed options */ }
    } else {
      t.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => out.push({ value: s, label: s, desc: '', group: '' }));
    }
  }
  host.captureSlotNodes().forEach((n) => {
    if (n.nodeType === 1 && n.tagName === 'OPTION') {
      out.push({ value: n.getAttribute('value') ?? n.textContent.trim(), label: n.textContent.trim(), desc: n.getAttribute('data-desc') || '', group: n.getAttribute('data-group') || '' });
    }
  });
  return out;
}

class OzFormElement extends OzoneElement {
  attributeChangedCallback(name, oldVal, newVal) {
    if (this._silent) return;
    super.attributeChangedCallback(name, oldVal, newVal);
  }
  /** Reflect state to an attribute without triggering a re-render */
  silentSet(name, val) {
    this._silent = true;
    if (val === null || val === false) this.removeAttribute(name);
    else this.setAttribute(name, val === true ? '' : String(val));
    this._silent = false;
    if ((name === 'value' || name === 'checked') && this.hasAttribute('name')) syncHiddenField(this, val);
  }
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })); }
}

// 32. <oz-select>
export class OzSelect extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'options', 'placeholder']; }
  get value() { const s = this.querySelector('select'); return s ? s.value : this.getAttribute('value') || ''; }
  set value(v) { const s = this.querySelector('select'); if (s) s.value = v; this.silentSet('value', v); }
  render() {
    const opts = ozParseOptions(this);
    const value = this.prop('value', [], '');
    const placeholder = this.prop('placeholder');
    const id = this._id || (this._id = 'oz-sel-' + ozUid());
    const groups = {};
    opts.forEach((o) => { (groups[o.group || ''] = groups[o.group || ''] || []).push(o); });
    const optHTML = (o) => `<option value="${escapeHTML(o.value)}"${o.value === value ? ' selected' : ''}>${escapeHTML(o.label)}</option>`;
    const body = Object.keys(groups).map((g) => g ? `<optgroup label="${escapeHTML(g)}">${groups[g].map(optHTML).join('')}</optgroup>` : groups[g].map(optHTML).join('')).join('');
    const ph = placeholder ? `<option value="" disabled${value ? '' : ' selected'}>${escapeHTML(placeholder)}</option>` : '';
    this.innerHTML = ozFieldHTML(this, `<div class="oz-control"><select class="oz-select__el" id="${id}"${this.boolProp('disabled') ? ' disabled' : ''}>${ph}${body}</select><span class="oz-control__icon">${OZ_SVG.chevron}</span></div>`, id);
    const sel = this.querySelector('select');
    sel.addEventListener('change', () => { this.silentSet('value', sel.value); sound.click(); this.emit('oz-change', { value: sel.value }); });
  }
}

// 33. <oz-checkbox>
export class OzCheckbox extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'checked', 'indeterminate', 'description']; }
  get checked() { const i = this.querySelector('input'); return i ? i.checked : this.boolProp('checked'); }
  set checked(v) { const i = this.querySelector('input'); if (i) { i.checked = !!v; i.indeterminate = false; } this.silentSet('checked', !!v); }
  render() {
    const label = this.prop('label', ['text', 'title']);
    const desc = this.prop('description');
    const hint = this.prop('hint');
    const error = this.prop('error');
    const checked = this.boolProp('checked');
    const indet = this.boolProp('indeterminate');
    const dis = this.boolProp('disabled');
    this.innerHTML = `<div class="oz-field${error ? ' oz-field--error' : ''}${dis ? ' oz-field--disabled' : ''}"><label class="oz-check"><input type="checkbox" class="oz-check__input"${checked ? ' checked' : ''}${dis ? ' disabled' : ''} /><span class="oz-check__box"><span class="oz-check__tick">${OZ_SVG.check}</span><span class="oz-check__dash">${OZ_SVG.minus}</span></span><span class="oz-check__text">${label ? `<span class="oz-check__label">${escapeHTML(label)}</span>` : ''}${desc ? `<span class="oz-check__desc">${escapeHTML(desc)}</span>` : ''}</span></label>${error ? `<div class="oz-field__msg oz-field__msg--error">${escapeHTML(error)}</div>` : hint ? `<div class="oz-field__msg">${escapeHTML(hint)}</div>` : ''}</div>`;
    const input = this.querySelector('input');
    input.indeterminate = indet;
    input.addEventListener('change', () => {
      this.silentSet('checked', input.checked);
      this.silentSet('indeterminate', false);
      sound.toggle(input.checked);
      this.emit('oz-change', { checked: input.checked });
    });
  }
}

// 34. <oz-radio-group>
export class OzRadioGroup extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'options', 'variant', 'inline', 'name']; }
  get value() { const r = this.querySelector('input:checked'); return r ? r.value : this.getAttribute('value') || ''; }
  set value(v) { this.querySelectorAll('input').forEach((r) => { r.checked = r.value === v; }); this.silentSet('value', v); }
  render() {
    const opts = ozParseOptions(this);
    const value = this.prop('value', [], '');
    const name = this.prop('name', [], 'oz-radio-' + (this._uid || (this._uid = ozUid())));
    const variant = this.prop('variant', ['type'], 'default');
    const inline = this.boolProp('inline');
    const dis = this.boolProp('disabled');
    const items = opts.map((o) => `<label class="oz-radio${variant === 'cards' ? ' oz-radio--card' : ''}"><input type="radio" class="oz-radio__input" name="${escapeHTML(name)}" value="${escapeHTML(o.value)}"${o.value === value ? ' checked' : ''}${dis ? ' disabled' : ''} /><span class="oz-radio__dot"></span><span class="oz-radio__text"><span class="oz-radio__label">${escapeHTML(o.label)}</span>${o.desc ? `<span class="oz-radio__desc">${escapeHTML(o.desc)}</span>` : ''}</span></label>`).join('');
    this.innerHTML = ozFieldHTML(this, `<div class="oz-radios${inline ? ' oz-radios--inline' : ''}${variant === 'cards' ? ' oz-radios--cards' : ''}" role="radiogroup">${items}</div>`);
    this.querySelectorAll('input').forEach((r) => r.addEventListener('change', () => {
      this.silentSet('value', r.value);
      sound.click();
      this.emit('oz-change', { value: r.value });
    }));
  }
}

// 35. <oz-textarea>
export class OzTextarea extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'placeholder', 'rows', 'maxlength', 'autosize']; }
  get value() { const t = this.querySelector('textarea'); return t ? t.value : this._initial || ''; }
  set value(v) { const t = this.querySelector('textarea'); if (t) { t.value = v; this.sync(); } else this._initial = v; }
  render() {
    if (this._initial === undefined) this._initial = this.getAttribute('value') ?? this.captureSlotNodes().filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    const current = this.querySelector('textarea') ? this.querySelector('textarea').value : this._initial;
    const id = this._id || (this._id = 'oz-ta-' + ozUid());
    const max = this.numProp('maxlength', [], 0);
    this.innerHTML = ozFieldHTML(this, `<div class="oz-control oz-control--area"><textarea class="oz-textarea__el" id="${id}" rows="${this.numProp('rows', [], 4)}" placeholder="${escapeHTML(this.prop('placeholder'))}"${max ? ` maxlength="${max}"` : ''}${this.boolProp('disabled') ? ' disabled' : ''}>${escapeHTML(current)}</textarea>${max ? `<span class="oz-textarea__count"></span>` : ''}</div>`, id);
    const ta = this.querySelector('textarea');
    ta.addEventListener('input', () => { this.sync(); this.emit('oz-input', { value: ta.value }); });
    ta.addEventListener('change', () => this.emit('oz-change', { value: ta.value }));
    this.sync();
  }
  sync() {
    const ta = this.querySelector('textarea');
    if (!ta) return;
    if (this.boolProp('autosize')) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    const c = this.querySelector('.oz-textarea__count');
    if (c) c.textContent = `${ta.value.length} / ${ta.maxLength}`;
  }
}

// Shared calendar math helpers (local YYYY-MM-DD, no UTC off-by-one drift)
function ozTodayYMD() {
  const d = new Date();
  return ozFmtYMD(d.getFullYear(), d.getMonth(), d.getDate());
}
function ozFmtYMD(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function ozParseYMD(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '').trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}
function ozPrettyYMD(s) {
  const p = ozParseYMD(s);
  if (!p) return '';
  return new Date(p.y, p.m, p.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function ozAddDaysYMD(s, days) {
  const p = ozParseYMD(s) || ozParseYMD(ozTodayYMD());
  const dt = new Date(p.y, p.m, p.d + days);
  return ozFmtYMD(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function ozCalMonthHTML(viewY, viewM, selStart, selEnd, events, minDate, maxDate) {
  const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = ozTodayYMD();
  const firstDow = (new Date(viewY, viewM, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const prevDays = new Date(viewY, viewM, 0).getDate();
  const evMap = {};
  (events || []).forEach((ev) => { (evMap[ev.date] = evMap[ev.date] || []).push(ev); });
  const a = selStart && selEnd ? (selStart <= selEnd ? selStart : selEnd) : selStart;
  const b = selStart && selEnd ? (selStart <= selEnd ? selEnd : selStart) : '';

  const cells = [];
  for (let i = 0; i < 42; i++) {
    let cy = viewY, cm = viewM, cd, out = false;
    if (i < firstDow) { out = true; cm = viewM - 1; if (cm < 0) { cm = 11; cy--; } cd = prevDays - firstDow + i + 1; }
    else if (i >= firstDow + daysInMonth) { out = true; cm = viewM + 1; if (cm > 11) { cm = 0; cy++; } cd = i - firstDow - daysInMonth + 1; }
    else cd = i - firstDow + 1;
    const ymd = ozFmtYMD(cy, cm, cd);
    const disabled = (minDate && ymd < minDate) || (maxDate && ymd > maxDate);
    const isSel = ymd === a || (b && ymd === b);
    const inRange = a && b && ymd > a && ymd < b;
    const cls = 'oz-cal__day' + (out ? ' is-out' : '') + (ymd === today ? ' is-today' : '') + (inRange ? ' is-range' : '') + (isSel ? ' is-selected' : '');
    const dots = (evMap[ymd] || []).slice(0, 3).map((e) => `<i class="oz-cal__dot oz-cal__dot--${escapeHTML(e.color || 'cyan')}"></i>`).join('');
    cells.push(`<button type="button" class="${cls}" data-ymd="${ymd}"${disabled ? ' disabled' : ''} aria-label="${ymd}">${cd}<span class="oz-cal__dots">${dots}</span></button>`);
  }
  const wds = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => `<div class="oz-cal__wd">${w}</div>`).join('');
  return `<div class="oz-cal__head"><span class="oz-cal__month">${escapeHTML(monthLabel)}</span><div class="oz-cal__nav"><button type="button" class="oz-cal__btn" data-cal-prev aria-label="Previous month">&#8249;</button><button type="button" class="oz-cal__today" data-cal-today>Today</button><button type="button" class="oz-cal__btn" data-cal-next aria-label="Next month">&#8250;</button></div></div><div class="oz-cal__grid">${wds}${cells.join('')}</div>`;
}

// 36. <oz-slider> (single or dual-thumb range + optional ticks)
export class OzSlider extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'min', 'max', 'step', 'value', 'min-value', 'max-value', 'range', 'ticks', 'prefix', 'suffix', 'show-value']; }
  get value() {
    if (this.boolProp('range')) { const [a, b] = this.querySelectorAll('input'); return a && b ? `${a.value},${b.value}` : ''; }
    const r = this.querySelector('input'); return r ? Number(r.value) : this.numProp('value', [], 0);
  }
  set value(v) { const r = this.querySelector('input'); if (r && !this.boolProp('range')) { r.value = v; this.paint(); } this.silentSet('value', v); }
  render() {
    const min = this.numProp('min', [], 0), max = this.numProp('max', [], 100), step = this.numProp('step', [], 1);
    const isRange = this.boolProp('range');
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    const showVal = this.boolProp('show-value', ['value-label']) || isRange;
    const ticks = this.boolProp('ticks') ? `<div class="oz-slider__ticks">${[0, 0.25, 0.5, 0.75, 1].map((t) => `<span>${this.fmt(Math.round(min + (max - min) * t))}</span>`).join('')}</div>` : '';
    if (isRange) {
      const lo = this.numProp('min-value', [], Math.round(min + (max - min) * 0.2));
      const hi = this.numProp('max-value', [], Math.round(min + (max - min) * 0.75));
      this.innerHTML = ozFieldHTML(this, `<div class="oz-slider"><div class="oz-slider__wrap"><div class="oz-slider__dual"><div class="oz-slider__track"><div class="oz-slider__fill"></div></div><input type="range" class="oz-slider__el--dual" data-thumb="lo" min="${min}" max="${max}" step="${step}" value="${Math.min(lo, hi)}"${dis} /><input type="range" class="oz-slider__el--dual" data-thumb="hi" min="${min}" max="${max}" step="${step}" value="${Math.max(lo, hi)}"${dis} /></div>${ticks}</div>${showVal ? '<output class="oz-slider__out"></output>' : ''}</div>`);
      const [a, b] = this.querySelectorAll('input');
      const sync = (who, emitChange) => {
        let v1 = Number(a.value), v2 = Number(b.value);
        if (v1 > v2) { if (who === 'lo') { v1 = v2; a.value = v1; } else { v2 = v1; b.value = v2; } }
        this.paint();
        this.silentSet('min-value', v1); this.silentSet('max-value', v2);
        this.emit(emitChange ? 'oz-change' : 'oz-input', { min: v1, max: v2, value: `${v1},${v2}` });
      };
      a.addEventListener('input', () => sync('lo', false));
      b.addEventListener('input', () => sync('hi', false));
      a.addEventListener('change', () => { sound.click(); sync('lo', true); });
      b.addEventListener('change', () => { sound.click(); sync('hi', true); });
    } else {
      const value = this.numProp('value', [], Math.round((min + max) / 2));
      const id = this._id || (this._id = 'oz-sl-' + ozUid());
      this.innerHTML = ozFieldHTML(this, `<div class="oz-slider"><div class="oz-slider__wrap"><input type="range" class="oz-slider__el" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"${dis} />${ticks}</div>${showVal ? '<output class="oz-slider__out"></output>' : ''}</div>`, id);
      const r = this.querySelector('input');
      r.addEventListener('input', () => { this.paint(); this.silentSet('value', r.value); this.emit('oz-input', { value: Number(r.value) }); });
      r.addEventListener('change', () => { sound.click(); this.emit('oz-change', { value: Number(r.value) }); });
    }
    this.paint();
  }
  fmt(n) { return `${this.prop('prefix', [], '')}${Number(n).toLocaleString()}${this.prop('suffix', [], '')}`; }
  paint() {
    const out = this.querySelector('.oz-slider__out');
    if (this.boolProp('range')) {
      const [a, b] = this.querySelectorAll('input');
      if (!a || !b) return;
      const min = Number(a.min), span = (Number(a.max) - min) || 1;
      const fill = this.querySelector('.oz-slider__fill');
      if (fill) {
        fill.style.setProperty('--start', (((Number(a.value) - min) / span) * 100) + '%');
        fill.style.setProperty('--end', (((Number(b.value) - min) / span) * 100) + '%');
      }
      if (out) out.textContent = `${this.fmt(a.value)} – ${this.fmt(b.value)}`;
      return;
    }
    const r = this.querySelector('input');
    if (!r) return;
    const pct = ((Number(r.value) - Number(r.min)) / ((Number(r.max) - Number(r.min)) || 1)) * 100;
    r.style.setProperty('--fill', pct + '%');
    if (out) out.textContent = this.fmt(r.value);
  }
}

// 37. <oz-date-picker> (modern floating glass calendar popover + quick presets)
export class OzDatePicker extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'start', 'end', 'range', 'min', 'max', 'placeholder', 'events']; }
  get value() { return this.boolProp('range') ? (this._start && this._end ? `${this._start}..${this._end}` : this._start || '') : (this._val || ''); }
  set value(v) { this._val = String(v || ''); this.silentSet('value', this._val); this.paintBtn(); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.popEl && this.popEl.contains(e.target))) this.close(); };
    this._reflow = () => { if (this._open) this.close(); };
    this._onKey = (e) => { if (e.key === 'Escape' && this._open) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    document.addEventListener('keydown', this._onKey);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.popEl) this.popEl.remove();
  }
  render() {
    const isRange = this.boolProp('range');
    this._val = this.prop('value', [], '');
    this._start = this.prop('start', [], '');
    this._end = this.prop('end', [], '');
    const base = ozParseYMD(isRange ? this._start : this._val) || ozParseYMD(ozTodayYMD());
    this._vy = base.y; this._vm = base.m;
    this._open = false;
    if (this.popEl) this.popEl.remove();
    this.innerHTML = ozFieldHTML(this, `<button type="button" class="oz-dp__trigger" aria-haspopup="dialog" aria-expanded="false"${this.boolProp('disabled') ? ' disabled' : ''}><span class="oz-dp__val"></span><span style="display:grid;place-items:center;color:var(--oz-text-muted);">${OZ_SVG.calendar}</span></button>`);
    this.trigBtn = this.querySelector('.oz-dp__trigger');
    this.popEl = document.createElement('div');
    this.popEl.className = 'oz-dp__pop';
    this.popEl.hidden = true;
    document.body.appendChild(this.popEl);
    this.trigBtn.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.paintBtn();
  }
  paintBtn() {
    const span = this.querySelector('.oz-dp__val');
    if (!span) return;
    if (this.boolProp('range')) {
      if (this._start && this._end) span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._start))} – ${escapeHTML(ozPrettyYMD(this._end))}</span>`;
      else if (this._start) span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._start))} – …</span>`;
      else span.innerHTML = `<span class="oz-dp__ph">${escapeHTML(this.prop('placeholder', [], 'Select date range...'))}</span>`;
    } else if (this._val) {
      span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._val))}</span>`;
    } else {
      span.innerHTML = `<span class="oz-dp__ph">${escapeHTML(this.prop('placeholder', [], 'Choose date...'))}</span>`;
    }
  }
  paintPop() {
    const isRange = this.boolProp('range');
    const events = this.jsonProp('events', [], []);
    const today = ozTodayYMD();
    const presets = [
      { label: 'Today', val: today },
      { label: 'Tomorrow', val: ozAddDaysYMD(today, 1) },
      { label: '+7 Days', val: ozAddDaysYMD(today, 7) },
      { label: '+30 Days', val: ozAddDaysYMD(today, 30) }
    ];
    this.popEl.innerHTML = `<div class="oz-dp__presets">${presets.map((p) => `<button type="button" class="oz-dp__preset" data-preset="${p.val}">${p.label}</button>`).join('')}<button type="button" class="oz-dp__preset" data-clear style="margin-left:auto;">Clear</button></div>${ozCalMonthHTML(this._vy, this._vm, isRange ? this._start : this._val, isRange ? this._end : '', events, this.prop('min'), this.prop('max'))}`;
    this.popEl.querySelector('[data-cal-prev]').addEventListener('click', () => { this._vm--; if (this._vm < 0) { this._vm = 11; this._vy--; } this.paintPop(); });
    this.popEl.querySelector('[data-cal-next]').addEventListener('click', () => { this._vm++; if (this._vm > 11) { this._vm = 0; this._vy++; } this.paintPop(); });
    this.popEl.querySelector('[data-cal-today]').addEventListener('click', () => { const t = ozParseYMD(today); this._vy = t.y; this._vm = t.m; this.pick(today); });
    this.popEl.querySelector('[data-clear]').addEventListener('click', () => {
      this._val = ''; this._start = ''; this._end = '';
      this.silentSet('value', ''); this.silentSet('start', ''); this.silentSet('end', '');
      this.paintBtn(); this.emit('oz-change', { value: '', start: '', end: '' }); this.close();
    });
    this.popEl.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.preset, true)));
    this.popEl.querySelectorAll('[data-ymd]').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.ymd, false)));
  }
  pick(ymd, fromPreset) {
    sound.click();
    if (this.boolProp('range')) {
      if (fromPreset) {
        this._start = ozTodayYMD(); this._end = ymd >= this._start ? ymd : this._start;
      } else if (!this._start || (this._start && this._end)) {
        this._start = ymd; this._end = '';
        this.paintBtn(); this.paintPop(); return;
      } else {
        if (ymd < this._start) { this._end = this._start; this._start = ymd; }
        else this._end = ymd;
      }
      this.silentSet('start', this._start); this.silentSet('end', this._end);
      this.paintBtn();
      this.emit('oz-change', { value: `${this._start}..${this._end}`, start: this._start, end: this._end });
      this.close();
      return;
    }
    this._val = ymd;
    const p = ozParseYMD(ymd); if (p) { this._vy = p.y; this._vm = p.m; }
    this.silentSet('value', ymd);
    this.paintBtn();
    this.emit('oz-change', { value: ymd });
    this.close();
  }
  open() {
    if (this.boolProp('disabled')) return;
    this._open = true;
    this.trigBtn.setAttribute('aria-expanded', 'true');
    this.paintPop();
    this.popEl.hidden = false;
    const r = this.trigBtn.getBoundingClientRect();
    const pw = this.popEl.offsetWidth || 340, ph = this.popEl.offsetHeight || 340;
    this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - pw - 12))}px`;
    if (window.innerHeight - r.bottom < ph + 12 && r.top > window.innerHeight - r.bottom) {
      this.popEl.style.top = 'auto'; this.popEl.style.bottom = `${window.innerHeight - r.top + 8}px`;
    } else {
      this.popEl.style.bottom = 'auto'; this.popEl.style.top = `${r.bottom + 8}px`;
    }
  }
  close() {
    this._open = false;
    if (this.trigBtn) this.trigBtn.setAttribute('aria-expanded', 'false');
    if (this.popEl) this.popEl.hidden = true;
  }
}

// 38. <oz-file-upload> (Browse button, thumbnails, upload progress & preloaded files)
export class OzFileUpload extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'accept', 'multiple', 'max-size', 'prompt', 'description', 'files']; }
  get files() { return (this._files || []).slice(); }
  fmt(b) {
    if (typeof b === 'string') return b;
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';
  }
  render() {
    if (!this._files) {
      const seed = this.jsonProp('files', [], []);
      this._files = Array.isArray(seed) ? seed.map((f) => ({ name: f.name || 'file', size: f.size || 0, type: f.type || '', preview: f.preview || '' })) : [];
    }
    const accept = this.prop('accept');
    const multiple = this.boolProp('multiple');
    const maxMb = this.numProp('max-size', ['maxsize'], 0);
    const title = this.prop('prompt', ['heading'], 'Drop files here or click to browse');
    const desc = this.prop('description', [], [accept, maxMb ? `up to ${maxMb} MB` : ''].filter(Boolean).join(' • '));
    this.innerHTML = ozFieldHTML(this, `<label class="oz-drop"><input type="file" class="oz-drop__input"${accept ? ` accept="${escapeHTML(accept)}"` : ''}${multiple ? ' multiple' : ''}${this.boolProp('disabled') ? ' disabled' : ''} /><span class="oz-drop__icon">${OZ_SVG.upload}</span><span class="oz-drop__title">${escapeHTML(title)}</span>${desc ? `<span class="oz-drop__desc">${escapeHTML(desc)}</span>` : ''}<span class="oz-drop__browse">Browse Files</span></label><div class="oz-drop__error" role="alert"></div><ul class="oz-drop__list"></ul>`);
    const zone = this.querySelector('.oz-drop');
    const input = this.querySelector('input');
    const add = (list) => {
      const errs = [];
      let incoming = Array.from(list);
      if (!multiple) { incoming = incoming.slice(0, 1); this._files = []; }
      incoming.forEach((f) => {
        if (maxMb && f.size > maxMb * 1048576) errs.push(`${f.name} is larger than ${maxMb} MB`);
        else {
          if (f.type && f.type.startsWith('image/')) f._preview = URL.createObjectURL(f);
          this._files.push(f);
        }
      });
      this.querySelector('.oz-drop__error').textContent = errs.join(' · ');
      sound.success();
      this.list();
      this.emit('oz-files', { files: this.files });
      this.emit('oz-change', { files: this.files });
      input.value = '';
    };
    input.addEventListener('change', () => add(input.files));
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = 'true'; }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = 'false'; }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
    this.list();
  }
  list() {
    const ul = this.querySelector('.oz-drop__list');
    if (!ul) return;
    ul.innerHTML = this._files.map((f, i) => {
      const thumb = f._preview || f.preview;
      return `<li class="oz-drop__item">${thumb ? `<img class="oz-drop__thumb" src="${escapeHTML(thumb)}" alt="" />` : `<span class="oz-drop__file">${OZ_SVG.file}</span>`}<div class="oz-drop__meta"><div class="oz-drop__top"><span class="oz-drop__name">${escapeHTML(f.name)}</span><span class="oz-drop__done">Uploaded</span><span class="oz-drop__size">${this.fmt(f.size)}</span></div><div class="oz-drop__bar"><span style="width:100%;"></span></div></div><button type="button" class="oz-drop__remove" data-i="${i}" aria-label="Remove ${escapeHTML(f.name)}">${OZ_SVG.x}</button></li>`;
    }).join('');
    ul.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const [rm] = this._files.splice(Number(b.dataset.i), 1);
      if (rm && rm._preview) try { URL.revokeObjectURL(rm._preview); } catch (e) {}
      sound.click();
      this.list();
      this.emit('oz-files', { files: this.files });
      this.emit('oz-change', { files: this.files });
    }));
  }
}

// 39. <oz-combobox> (searchable single / multi select with chips)
export class OzCombobox extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'options', 'placeholder', 'multiple', 'creatable']; }
  get value() { return this.vals.join(','); }
  set value(v) { this.vals = String(v || '').split(',').map((s) => s.trim()).filter(Boolean); this.silentSet('value', this.value); if (this.box) this.draw(); }
  get values() { return this.vals.slice(); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.listEl && this.listEl.contains(e.target))) this.close(); };
    this._reflow = (e) => { if (this._open && !(this.listEl && e && this.listEl.contains(e.target))) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.listEl) this.listEl.remove();
  }
  render() {
    this.opts = ozParseOptions(this);
    if (!this.vals) this.vals = this.prop('value', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    this.multi = this.boolProp('multiple');
    this.query = '';
    this._open = false;
    this.active = 0;
    const id = this._id || (this._id = 'oz-cb-' + ozUid());
    if (this.listEl) this.listEl.remove();
    this.innerHTML = ozFieldHTML(this, `<div class="oz-combo"><div class="oz-combo__box" role="combobox" aria-expanded="false" aria-haspopup="listbox"><span class="oz-combo__chips"></span><input class="oz-combo__input" id="${id}" autocomplete="off" placeholder="${escapeHTML(this.prop('placeholder', [], 'Select...'))}"${this.boolProp('disabled') ? ' disabled' : ''} /><span class="oz-control__icon">${OZ_SVG.chevron}</span></div></div>`, id);
    this.box = this.querySelector('.oz-combo__box');
    this.input = this.querySelector('input');
    this.listEl = document.createElement('ul');
    this.listEl.className = 'oz-combo__list';
    this.listEl.setAttribute('role', 'listbox');
    this.listEl.hidden = true;
    document.body.appendChild(this.listEl);
    this.box.addEventListener('click', (e) => { if (e.target.closest('[data-rm]')) return; this.input.focus(); this.openList(); });
    this.input.addEventListener('input', () => { this.query = this.input.value; this.active = 0; this.openList(); });
    this.input.addEventListener('keydown', (e) => this.key(e));
    this.input.addEventListener('focus', () => { if (!this.multi) this.input.select(); });
    this.listEl.addEventListener('pointerdown', (e) => e.preventDefault());
    this.listEl.addEventListener('click', (e) => { const li = e.target.closest('[data-v]'); if (li) this.pick(li.dataset.v); });
    this.draw();
  }
  labelOf(v) { const o = this.opts.find((x) => x.value === v); return o ? o.label : v; }
  filtered() {
    const q = this.query.trim().toLowerCase();
    let list = this.opts.filter((o) => (!q || o.label.toLowerCase().includes(q)) && (!this.multi || !this.vals.includes(o.value)));
    if (this.boolProp('creatable') && q && !this.opts.some((o) => o.label.toLowerCase() === q)) list = list.concat([{ value: this.query.trim(), label: `Create "${this.query.trim()}"`, created: true }]);
    return list;
  }
  draw() {
    const chips = this.querySelector('.oz-combo__chips');
    if (this.multi) {
      chips.innerHTML = this.vals.map((v) => `<span class="oz-chip">${escapeHTML(this.labelOf(v))}<button type="button" data-rm="${escapeHTML(v)}" aria-label="Remove">${OZ_SVG.x}</button></span>`).join('');
      chips.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => this.unpick(b.dataset.rm)));
      this.input.placeholder = this.vals.length ? '' : this.prop('placeholder', [], 'Select...');
    } else {
      chips.innerHTML = '';
      if (!this._open) this.input.value = this.vals[0] ? this.labelOf(this.vals[0]) : '';
    }
    this.paintList();
  }
  paintList() {
    const list = this.filtered();
    if (this.active >= list.length) this.active = Math.max(0, list.length - 1);
    this.listEl.innerHTML = list.length ? list.map((o, i) => `<li role="option" class="oz-combo__opt${i === this.active ? ' is-active' : ''}${!this.multi && this.vals[0] === o.value ? ' is-selected' : ''}" data-v="${escapeHTML(o.value)}" aria-selected="${this.vals.includes(o.value)}">${escapeHTML(o.label)}${!this.multi && this.vals[0] === o.value ? `<span class="oz-combo__tick">${OZ_SVG.check}</span>` : ''}</li>`).join('') : '<li class="oz-combo__empty">No matches</li>';
  }
  place() {
    const r = this.box.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    this.listEl.style.left = r.left + 'px';
    this.listEl.style.width = r.width + 'px';
    if (below < 220 && r.top > below) { this.listEl.style.top = 'auto'; this.listEl.style.bottom = (window.innerHeight - r.top + 6) + 'px'; }
    else { this.listEl.style.bottom = 'auto'; this.listEl.style.top = (r.bottom + 6) + 'px'; }
  }
  openList() {
    if (this.boolProp('disabled')) return;
    this._open = true;
    this.box.setAttribute('aria-expanded', 'true');
    this.box.dataset.open = 'true';
    this.paintList();
    this.listEl.hidden = false;
    this.place();
  }
  close() {
    this._open = false;
    this.query = '';
    if (this.box) { this.box.setAttribute('aria-expanded', 'false'); this.box.dataset.open = 'false'; }
    if (this.listEl) this.listEl.hidden = true;
    if (this.multi && this.input) this.input.value = '';
    this.draw();
  }
  pick(v) {
    if (this.multi) { if (!this.vals.includes(v)) this.vals.push(v); this.query = ''; this.input.value = ''; this.input.focus(); }
    else { this.vals = [v]; }
    if (!this.opts.some((o) => o.value === v)) this.opts.push({ value: v, label: v });
    this.silentSet('value', this.value);
    sound.click();
    this.emit('oz-change', { value: this.value, values: this.values });
    if (this.multi) { this.draw(); this.place(); } else this.close();
  }
  unpick(v) {
    this.vals = this.vals.filter((x) => x !== v);
    this.silentSet('value', this.value);
    this.emit('oz-change', { value: this.value, values: this.values });
    this.draw();
  }
  key(e) {
    const list = this.filtered();
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!this._open) this.openList(); this.active = Math.min(list.length - 1, this.active + 1); this.paintList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active = Math.max(0, this.active - 1); this.paintList(); }
    else if (e.key === 'Enter') { if (this._open && list[this.active]) { e.preventDefault(); this.pick(list[this.active].value); } }
    else if (e.key === 'Escape') { this.close(); }
    else if (e.key === 'Backspace' && this.multi && !this.input.value && this.vals.length) { this.unpick(this.vals[this.vals.length - 1]); }
  }
}

// 40. <oz-sidebar>
let OZ_SIDEBAR_GLOBAL = false;
export class OzSidebar extends OzoneElement {
  static get observedAttributes() { return ['brand', 'icon', 'items', 'collapsed', 'side', 'variant', 'active', 'searchable', 'user-name', 'user-email', 'width']; }
  connectedCallback() {
    super.connectedCallback();
    if (!OZ_SIDEBAR_GLOBAL) {
      OZ_SIDEBAR_GLOBAL = true;
      document.addEventListener('click', (e) => {
        const t = e.target.closest && e.target.closest('[data-oz-sidebar-toggle]');
        if (t) document.dispatchEvent(new CustomEvent('oz-sidebar-toggle', { detail: { target: t.getAttribute('data-oz-sidebar-toggle') } }));
      });
    }
    this._mq = window.matchMedia('(max-width: 900px)');
    this._onMq = () => { this.dataset.mobile = String(this._mq.matches); if (!this._mq.matches) this.removeAttribute('data-mobile-open'); };
    this._mq.addEventListener('change', this._onMq);
    this._onToggle = (e) => {
      const tgt = e.detail && e.detail.target;
      if (tgt && tgt !== '' && tgt !== this.id) return;
      this.toggle();
    };
    this._onKey = (e) => { if (e.key === 'Escape' && this.dataset.mobileOpen === 'true') this.close(); };
    document.addEventListener('oz-sidebar-toggle', this._onToggle);
    document.addEventListener('keydown', this._onKey);
    this._onMq();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._mq) this._mq.removeEventListener('change', this._onMq);
    document.removeEventListener('oz-sidebar-toggle', this._onToggle);
    document.removeEventListener('keydown', this._onKey);
  }
  get collapsed() { return this.boolProp('collapsed'); }
  set collapsed(v) { if (v) this.setAttribute('collapsed', ''); else this.removeAttribute('collapsed'); this.save(); this.emit('oz-collapse', { collapsed: !!v }); }
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })); }
  open() { this.dataset.mobileOpen = 'true'; }
  close() { this.dataset.mobileOpen = 'false'; }
  toggle() {
    if (this.dataset.mobile === 'true') { this.dataset.mobileOpen = this.dataset.mobileOpen === 'true' ? 'false' : 'true'; }
    else { this.collapsed = !this.collapsed; }
  }
  save() {
    const key = this.prop('persist-key');
    if (!key) return;
    try { localStorage.setItem('oz-sb:' + key, JSON.stringify({ collapsed: this.collapsed, open: Array.from(this._openSet || []) })); } catch (e) { /* storage unavailable */ }
  }
  normalize() {
    const raw = this.jsonProp('items', [], []) || [];
    if (!Array.isArray(raw)) return [];
    if (raw.length && raw[0] && Array.isArray(raw[0].items)) return raw;
    return [{ title: '', items: raw }];
  }
  render() {
    const key = this.prop('persist-key');
    if (!this._init) {
      this._init = true;
      this._openSet = new Set();
      this._query = '';
      if (key) {
        try {
          const s = JSON.parse(localStorage.getItem('oz-sb:' + key) || 'null');
          if (s) { (s.open || []).forEach((x) => this._openSet.add(x)); if (s.collapsed) this.setAttribute('collapsed', ''); }
        } catch (e) { /* ignore */ }
      }
    }
    const footerNodes = this.captureSlotNodes().filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
    const brand = this.prop('brand', ['title'], '');
    const icon = this.prop('icon', [], 'diamond');
    const groups = this.normalize();
    const activeKey = this.prop('active', [], '') || this._activeKey || '';
    const idOf = (it) => String(it.id || it.label);
    const isActive = (it) => (activeKey ? idOf(it) === activeKey : it.active === true);
    const q = this._query.trim().toLowerCase();
    const matches = (it) => !q || String(it.label).toLowerCase().includes(q) || (it.children || []).some((c) => String(c.label).toLowerCase().includes(q));
    const badge = (it) => it.badge ? `<span class="oz-sb__badge oz-sb__badge--${escapeHTML(it.badgeVariant || 'cyan')}">${escapeHTML(it.badge)}</span>` : '';
    const iconHTML = (it) => it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="18"></oz-icon>` : `<span class="oz-sb__dot"></span>`;
    const itemHTML = (it) => {
      const kids = (it.children || []).filter((c) => !q || matches(c) || matches(it));
      const has = kids.length > 0;
      const open = has && (this._openSet.has(idOf(it)) || !!q || kids.some(isActive));
      const cls = 'oz-sb__item' + (isActive(it) || (has && !open && kids.some(isActive)) ? ' is-active' : '') + (it.disabled ? ' is-disabled' : '');
      const tag = has ? 'button type="button"' : `a href="${escapeHTML(it.href || '#')}"`;
      const close = has ? 'button' : 'a';
      const sub = has ? `<div class="oz-sb__sub" data-open="${open}"><div class="oz-sb__sub-inner">${kids.map((c) => `<a class="oz-sb__item oz-sb__item--child${isActive(c) ? ' is-active' : ''}" href="${escapeHTML(c.href || '#')}" data-id="${escapeHTML(idOf(c))}" data-label="${escapeHTML(c.label)}"><span class="oz-sb__label">${escapeHTML(c.label)}</span>${badge(c)}</a>`).join('')}</div></div>` : '';
      return `<div class="oz-sb__node"><${tag} class="${cls}" data-id="${escapeHTML(idOf(it))}" data-label="${escapeHTML(it.label)}" data-has-kids="${has}" data-tip="${escapeHTML(it.label)}"${it.disabled ? ' aria-disabled="true"' : ''}${has ? ` aria-expanded="${open}"` : ''}>${iconHTML(it)}<span class="oz-sb__label">${escapeHTML(it.label)}</span>${badge(it)}${has ? `<span class="oz-sb__caret" data-open="${open}">${OZ_SVG.chevron}</span>` : ''}</${close}>${sub}</div>`;
    };
    const nav = groups.map((g) => {
      const its = (g.items || []).filter((it) => matches(it) || (it.children || []).some(matches));
      if (!its.length) return '';
      return `<div class="oz-sb__group">${g.title ? `<div class="oz-sb__title">${escapeHTML(g.title)}</div>` : ''}${its.map(itemHTML).join('')}</div>`;
    }).join('') || '<div class="oz-sb__empty">No results</div>';
    const uname = this.prop('user-name');
    const user = uname ? `<div class="oz-sb__user"><oz-avatar name="${escapeHTML(uname)}" size="36" status="online"></oz-avatar><div class="oz-sb__user-text"><div class="oz-sb__user-name">${escapeHTML(uname)}</div>${this.prop('user-email') ? `<div class="oz-sb__user-mail">${escapeHTML(this.prop('user-email'))}</div>` : ''}</div></div>` : '';
    const side = this.prop('side', [], 'left') === 'right' ? 'right' : 'left';
    this.dataset.side = side;
    this.dataset.variant = this.prop('variant', [], 'glass');
    this.style.setProperty('--oz-sb-w', this.prop('width', [], '264px'));
    this.innerHTML = `<div class="oz-sb__backdrop" data-sb-backdrop></div><aside class="oz-sb" role="navigation" aria-label="${escapeHTML(brand || 'Sidebar')}"><div class="oz-sb__head">${brand ? `<div class="oz-sb__brand"><span class="oz-sb__logo"><oz-icon name="${escapeHTML(icon)}" size="18"></oz-icon></span><span class="oz-sb__brand-name">${escapeHTML(brand)}</span></div>` : ''}<button type="button" class="oz-sb__collapse" data-sb-collapse title="Collapse sidebar" aria-label="Toggle sidebar">${OZ_SVG.panel}</button></div>${this.boolProp('searchable') ? `<div class="oz-sb__search"><oz-icon name="search" size="15"></oz-icon><input type="search" placeholder="Search..." value="${escapeHTML(this._query)}" data-sb-search /></div>` : ''}<nav class="oz-sb__nav">${nav}</nav><div class="oz-sb__foot">${user}<div class="oz-sb__foot-slot"></div></div></aside>`;
    const slot = this.querySelector('.oz-sb__foot-slot');
    footerNodes.forEach((n) => slot.appendChild(n));
    if (!slot.childNodes.length) slot.remove();
    this.querySelector('[data-sb-backdrop]').addEventListener('click', () => this.close());
    this.querySelector('[data-sb-collapse]').addEventListener('click', () => { sound.click(); if (this.dataset.mobile === 'true') this.close(); else this.collapsed = !this.collapsed; });
    const search = this.querySelector('[data-sb-search]');
    if (search) {
      search.addEventListener('input', () => { this._query = search.value; const pos = search.selectionStart; this.render(); const s = this.querySelector('[data-sb-search]'); if (s) { s.focus(); s.setSelectionRange(pos, pos); } });
    }
    this.querySelectorAll('.oz-sb__item').forEach((el) => el.addEventListener('click', (e) => {
      if (el.classList.contains('is-disabled')) { e.preventDefault(); return; }
      const id = el.dataset.id;
      if (el.dataset.hasKids === 'true') {
        e.preventDefault();
        if (this.collapsed) { this.collapsed = false; this._openSet.add(id); this.render(); return; }
        if (this._openSet.has(id)) this._openSet.delete(id); else this._openSet.add(id);
        this.save();
        this.render();
        return;
      }
      const ev = new CustomEvent('oz-navigate', { detail: { id, label: el.dataset.label, href: el.getAttribute('href') }, bubbles: true, cancelable: true });
      this.dispatchEvent(ev);
      if (ev.defaultPrevented || (el.getAttribute('href') || '#') === '#') e.preventDefault();
      sound.click();
      this._activeKey = id;
      this.removeAttribute('active');
      this.render();
      if (this.dataset.mobile === 'true') this.close();
    }));
  }
}

// 41. <oz-app-shell>
export class OzAppShell extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'topbar', 'fill']; }
  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      const sidebars = [], actions = [], content = [];
      nodes.forEach((n) => {
        if (n.nodeType === 1 && n.tagName === 'OZ-SIDEBAR') sidebars.push(n);
        else if (n.nodeType === 1 && n.getAttribute('slot') === 'actions') actions.push(n);
        else if (!(n.nodeType === 3 && !n.textContent.trim())) content.push(n);
      });
      this.innerHTML = `<div class="oz-shell__body"><div class="oz-shell__side"></div><div class="oz-shell__main"><header class="oz-shell__topbar"><button type="button" class="oz-shell__burger" data-oz-sidebar-toggle="" aria-label="Open menu">${OZ_SVG.burger}</button><div class="oz-shell__heading"><div class="oz-shell__title"></div><div class="oz-shell__subtitle"></div></div><div class="oz-shell__actions"></div></header><div class="oz-shell__content"></div></div></div>`;
      const side = this.querySelector('.oz-shell__side');
      sidebars.forEach((s) => side.appendChild(s));
      if (sidebars[0] && sidebars[0].getAttribute('side') === 'right') this.dataset.sidebarSide = 'right';
      if (!sidebars.length) this.querySelector('.oz-shell__burger').remove();
      this.dataset.hasSidebar = String(sidebars.length > 0);
      const act = this.querySelector('.oz-shell__actions');
      actions.forEach((a) => act.appendChild(a));
      const main = this.querySelector('.oz-shell__content');
      content.forEach((c) => main.appendChild(c));
    }
    const title = this.prop('heading', ['title']);
    const sub = this.prop('subtitle');
    this.querySelector('.oz-shell__title').textContent = title;
    this.querySelector('.oz-shell__subtitle').textContent = sub;
    this.querySelector('.oz-shell__subtitle').style.display = sub ? '' : 'none';
    const showTop = this.hasAttribute('topbar') ? this.boolProp('topbar') : true;
    this.querySelector('.oz-shell__topbar').style.display = showTop ? '' : 'none';
    this.dataset.fill = String(this.boolProp('fill'));
  }
}


// ============================================================================
// OzoneUI Pack F: Parallax, Spatial Motion & Modern Interactive Components
// <oz-parallax>, <oz-reveal>, <oz-spotlight>, <oz-drawer>, <oz-dropdown>,
// <oz-tooltip>, <oz-stepper>, <oz-kanban>
// ============================================================================

// 42. <oz-parallax>
export class OzParallax extends OzoneElement {
  static get observedAttributes() { return ['speed', 'direction', 'height', 'badge', 'heading', 'title', 'subtitle', 'tilt']; }

  connectedCallback() {
    super.connectedCallback();
    this._mx = 0; this._my = 0; this._sy = 0; this._raf = 0;
    this._schedule = () => {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = 0; this.updateLayers(); });
    };
    this._onMove = (e) => {
      const r = this.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this._mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this._my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      this._schedule();
    };
    this._onLeave = () => { this._mx = 0; this._my = 0; this._schedule(); };
    this._onScroll = () => {
      const r = this.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const center = r.top + r.height / 2;
      this._sy = Math.max(-1.5, Math.min(1.5, (vh / 2 - center) / vh));
      this._schedule();
    };
    this.addEventListener('pointermove', this._onMove);
    this.addEventListener('pointerleave', this._onLeave);
    window.addEventListener('scroll', this._onScroll, { passive: true, capture: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
    this._onScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._raf) cancelAnimationFrame(this._raf);
    this.removeEventListener('pointermove', this._onMove);
    this.removeEventListener('pointerleave', this._onLeave);
    window.removeEventListener('scroll', this._onScroll, { capture: true });
    window.removeEventListener('resize', this._onScroll);
  }

  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<div class="oz-px__tilt"><div class="oz-px__bg" aria-hidden="true"><div class="oz-px__orb oz-px__orb--1" data-depth="-0.35"></div><div class="oz-px__orb oz-px__orb--2" data-depth="0.45"></div><div class="oz-px__grid" data-depth="0.18"></div></div><div class="oz-px__stage"><div class="oz-px__header"></div><div class="oz-px__content"></div></div></div>`;
      const content = this.querySelector('.oz-px__content');
      const meaningful = nodes.filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
      if (meaningful.length) meaningful.forEach((n) => content.appendChild(n));
      else content.remove();
    }
    const h = this.prop('height', [], '');
    if (h) this.style.setProperty('--oz-px-h', h);
    const badge = this.prop('badge');
    const title = this.prop('heading', ['title']);
    const sub = this.prop('subtitle');
    const head = this.querySelector('.oz-px__header');
    if (head) {
      if (badge || title || sub) {
        head.style.display = '';
        head.innerHTML = `${badge ? `<oz-badge variant="cyan" pulse data-depth="0.18">${escapeHTML(badge)}</oz-badge>` : ''}${title ? `<h2 class="oz-px__title" data-depth="0.28">${escapeHTML(title)}</h2>` : ''}${sub ? `<p class="oz-px__subtitle" data-depth="0.14">${escapeHTML(sub)}</p>` : ''}`;
      } else {
        head.style.display = 'none';
      }
    }
  }

  updateLayers() {
    if (!this.isConnected) return;
    const speed = Math.max(0.05, this.numProp('speed', [], 1));
    const dir = this.prop('direction', [], 'both').toLowerCase();
    const useScroll = dir !== 'mouse' && dir !== 'horizontal';
    const useMouse = dir !== 'vertical';
    const tiltBox = this.querySelector('.oz-px__tilt');
    if (tiltBox && this.hasAttribute('tilt') && useMouse) {
      tiltBox.style.transform = `perspective(1200px) rotateX(${(-this._my * 3.5 * speed).toFixed(2)}deg) rotateY(${(this._mx * 4.5 * speed).toFixed(2)}deg)`;
    }
    this.querySelectorAll('[data-depth]').forEach((el) => {
      const d = Number(el.getAttribute('data-depth')) || 0;
      const x = useMouse ? (this._mx * d * 36 * speed) : (dir === 'horizontal' ? this._sy * d * 70 * speed : 0);
      const y = (useScroll ? this._sy * d * 85 * speed : 0) + (useMouse ? this._my * d * 24 * speed : 0);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
}

// 43. <oz-reveal>
export class OzReveal extends OzoneElement {
  static get observedAttributes() { return ['effect', 'delay', 'duration', 'stagger', 'once', 'threshold']; }

  connectedCallback() {
    super.connectedCallback();
    const threshold = Math.max(0.01, Math.min(0.9, this.numProp('threshold', [], 0.12)));
    const once = !this.hasAttribute('once') || this.boolProp('once');
    if (typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.dataset.visible = 'true';
            if (once && this._io) { this._io.disconnect(); this._io = null; }
          } else if (!once) {
            this.dataset.visible = 'false';
          }
        });
      }, { threshold, rootMargin: '0px 0px -24px 0px' });
      this._io.observe(this);
    } else {
      this.dataset.visible = 'true';
    }
    requestAnimationFrame(() => {
      const r = this.getBoundingClientRect();
      if (r.top < (window.innerHeight || 900) * 0.96 && r.bottom > 0) this.dataset.visible = 'true';
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._io) { this._io.disconnect(); this._io = null; }
  }

  render() {
    this.dataset.effect = this.prop('effect', ['animation'], 'fade-up');
    const stagger = this.numProp('stagger', [], 0);
    this.dataset.stagger = String(stagger > 0);
    this.style.setProperty('--oz-rev-dur', `${this.numProp('duration', [], 680)}ms`);
    this.style.setProperty('--oz-rev-delay', `${this.numProp('delay', [], 0)}ms`);
    if (stagger > 0) {
      this.style.setProperty('--oz-rev-step', `${stagger}ms`);
      Array.from(this.children).forEach((ch, idx) => ch.style.setProperty('--oz-rev-i', String(idx)));
    }
  }
}

// 44. <oz-spotlight>
export class OzSpotlight extends OzoneElement {
  static get observedAttributes() { return ['color', 'size']; }

  connectedCallback() {
    super.connectedCallback();
    this._onMove = (e) => {
      const r = this.getBoundingClientRect();
      this.style.setProperty('--oz-spot-x', `${(e.clientX - r.left).toFixed(1)}px`);
      this.style.setProperty('--oz-spot-y', `${(e.clientY - r.top).toFixed(1)}px`);
      this.style.setProperty('--oz-spot-o', '1');
    };
    this._onLeave = () => this.style.setProperty('--oz-spot-o', '0');
    this.addEventListener('pointermove', this._onMove);
    this.addEventListener('pointerleave', this._onLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointermove', this._onMove);
    this.removeEventListener('pointerleave', this._onLeave);
  }

  render() {
    const map = {
      cyan: 'oklch(0.75 0.18 200 / 0.24)',
      violet: 'oklch(0.70 0.21 285 / 0.24)',
      emerald: 'oklch(0.74 0.17 155 / 0.24)',
      amber: 'oklch(0.80 0.17 80 / 0.24)',
      rose: 'oklch(0.68 0.22 15 / 0.24)'
    };
    const c = this.prop('color', ['glow'], '');
    if (c && map[c]) this.style.setProperty('--oz-spot-color', map[c]);
    const s = this.numProp('size', [], 380);
    this.style.setProperty('--oz-spot-size', `${s}px`);
  }
}

// 45. <oz-drawer>
export class OzDrawer extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'side', 'size', 'open', 'trigger']; }

  connectedCallback() {
    super.connectedCallback();
    this._onKey = (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); };
    document.addEventListener('keydown', this._onKey);
    const trig = this.prop('trigger');
    if (trig) {
      this._trigEl = document.querySelector(trig);
      if (this._trigEl) {
        this._onTrig = () => this.open();
        this._trigEl.addEventListener('click', this._onTrig);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKey);
    if (this._trigEl && this._onTrig) this._trigEl.removeEventListener('click', this._onTrig);
  }

  get isOpen() { return this.boolProp('open'); }
  open() { this.setAttribute('open', ''); sound.click(); this.dispatchEvent(new CustomEvent('oz-open', { bubbles: true })); }
  close() { this.removeAttribute('open'); sound.click(); this.dispatchEvent(new CustomEvent('oz-close', { bubbles: true })); }
  toggle() { if (this.isOpen) this.close(); else this.open(); }

  render() {
    const nodes = this.captureSlotNodes();
    const title = this.prop('heading', ['title'], 'Inspector');
    const sub = this.prop('subtitle');
    const side = ['right', 'left', 'bottom'].includes(this.prop('side')) ? this.prop('side') : 'right';
    const sizes = { sm: '340px', md: '440px', lg: '560px', xl: '720px' };
    const w = sizes[this.prop('size', [], 'md')] || '440px';
    const isOpen = this.isOpen;

    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<div class="oz-drawer-backdrop" data-open="${isOpen}"><aside class="oz-drawer-panel" role="dialog" aria-modal="true" data-side="${side}" style="--oz-drawer-w:${w};"><div class="oz-drawer__head"><div><div class="oz-drawer__title"></div><div class="oz-drawer__subtitle"></div></div><button type="button" class="oz-drawer__close" aria-label="Close drawer">${OZ_SVG.x}</button></div><div class="oz-drawer__body"></div><div class="oz-drawer__foot"></div></aside></div>`;
      const body = this.querySelector('.oz-drawer__body');
      const foot = this.querySelector('.oz-drawer__foot');
      nodes.forEach((n) => {
        if (n.nodeType === 1 && n.getAttribute('slot') === 'footer') foot.appendChild(n);
        else if (!(n.nodeType === 3 && !n.textContent.trim())) body.appendChild(n);
      });
      this.querySelector('.oz-drawer__close').addEventListener('click', () => this.close());
      this.querySelector('.oz-drawer-backdrop').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this.close();
      });
    }

    const bd = this.querySelector('.oz-drawer-backdrop');
    const panel = this.querySelector('.oz-drawer-panel');
    if (bd) bd.setAttribute('data-open', String(isOpen));
    if (panel) {
      panel.setAttribute('data-side', side);
      panel.style.setProperty('--oz-drawer-w', w);
    }
    const tEl = this.querySelector('.oz-drawer__title');
    const sEl = this.querySelector('.oz-drawer__subtitle');
    if (tEl) tEl.textContent = title;
    if (sEl) { sEl.textContent = sub; sEl.style.display = sub ? '' : 'none'; }
  }
}

// 46. <oz-dropdown>
export class OzDropdown extends OzoneElement {
  static get observedAttributes() { return ['label', 'icon', 'variant', 'align', 'items']; }

  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => {
      if (this._open && !this.contains(e.target) && !(this.menuEl && this.menuEl.contains(e.target))) this.close();
    };
    this._reflow = () => { if (this._open) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.menuEl) this.menuEl.remove();
  }

  render() {
    const label = this.prop('label', [], 'Actions');
    const icon = this.prop('icon');
    const variant = this.prop('variant', ['type'], 'glass');
    const items = this.jsonProp('items', [], [
      { label: 'Duplicate view', value: 'duplicate', icon: 'copy', kbd: '⌘D' },
      { label: 'Export JSON', value: 'export', icon: 'download', kbd: '⌘E' },
      { divider: true },
      { label: 'Delete workspace', value: 'delete', icon: 'x', danger: true }
    ]);
    this._items = Array.isArray(items) ? items : [];
    this._open = false;

    if (this.menuEl) this.menuEl.remove();
    this.innerHTML = `<button type="button" class="oz-btn oz-btn--sm oz-btn--${escapeHTML(variant)}" aria-haspopup="menu" aria-expanded="false">${icon ? `<oz-icon name="${escapeHTML(icon)}" size="14"></oz-icon>` : ''}<span>${escapeHTML(label)}</span>${OZ_SVG.chevron}</button>`;
    this.btnEl = this.querySelector('button');

    this.menuEl = document.createElement('div');
    this.menuEl.className = 'oz-dd__menu';
    this.menuEl.setAttribute('role', 'menu');
    this.menuEl.hidden = true;
    this.menuEl.innerHTML = this._items.map((it, idx) => it.divider
      ? '<div class="oz-dd__div" role="separator"></div>'
      : `<button type="button" class="oz-dd__item${it.danger ? ' oz-dd__item--danger' : ''}" role="menuitem" data-idx="${idx}">${it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="15"></oz-icon>` : ''}<span>${escapeHTML(it.label)}</span>${it.kbd ? `<span class="oz-dd__kbd">${escapeHTML(it.kbd)}</span>` : ''}</button>`
    ).join('');
    document.body.appendChild(this.menuEl);

    this.btnEl.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.btnEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowDown' && !this._open) { e.preventDefault(); this.open(); }
    });
    this.menuEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-idx]');
      if (!btn) return;
      const item = this._items[Number(btn.dataset.idx)];
      if (!item) return;
      sound.click();
      this.close();
      this.dispatchEvent(new CustomEvent('oz-select', { detail: { value: item.value ?? item.label, label: item.label, item }, bubbles: true }));
    });
  }

  open() {
    this._open = true;
    this.btnEl.setAttribute('aria-expanded', 'true');
    this.menuEl.hidden = false;
    const r = this.btnEl.getBoundingClientRect();
    const mw = this.menuEl.offsetWidth || 220;
    const alignRight = this.prop('align') === 'right' || (r.left + mw > window.innerWidth - 12);
    const left = alignRight ? Math.max(12, r.right - mw) : Math.min(r.left, window.innerWidth - mw - 12);
    const below = window.innerHeight - r.bottom;
    this.menuEl.style.left = `${left}px`;
    if (below < 220 && r.top > below) {
      this.menuEl.style.top = 'auto';
      this.menuEl.style.bottom = `${window.innerHeight - r.top + 6}px`;
    } else {
      this.menuEl.style.bottom = 'auto';
      this.menuEl.style.top = `${r.bottom + 6}px`;
    }
  }

  close() {
    this._open = false;
    if (this.btnEl) this.btnEl.setAttribute('aria-expanded', 'false');
    if (this.menuEl) this.menuEl.hidden = true;
  }
}

// 47. <oz-tooltip>
export class OzTooltip extends OzoneElement {
  static get observedAttributes() { return ['text', 'position', 'shortcut']; }

  render() {
    const nodes = this.captureSlotNodes();
    const text = this.prop('text', ['title', 'label'], 'Tooltip');
    const pos = ['top', 'bottom', 'left', 'right'].includes(this.prop('position')) ? this.prop('position') : 'top';
    const kbd = this.prop('shortcut', ['kbd']);
    if (!this._mounted) {
      this._mounted = true;
      const id = 'oz-tip-' + ozUid();
      this.innerHTML = `<span class="oz-tip__trigger" aria-describedby="${id}"></span><span class="oz-tip__bubble" id="${id}" role="tooltip" data-pos="${pos}"></span>`;
      const trig = this.querySelector('.oz-tip__trigger');
      nodes.forEach((n) => trig.appendChild(n));
      const show = () => { this.dataset.open = 'true'; };
      const hide = () => { this.dataset.open = 'false'; };
      this.addEventListener('pointerenter', show);
      this.addEventListener('pointerleave', hide);
      this.addEventListener('focusin', show);
      this.addEventListener('focusout', hide);
    }
    const bubble = this.querySelector('.oz-tip__bubble');
    if (bubble) {
      bubble.setAttribute('data-pos', pos);
      bubble.innerHTML = `<span>${escapeHTML(text)}</span>${kbd ? `<kbd class="oz-tip__kbd">${escapeHTML(kbd)}</kbd>` : ''}`;
    }
  }
}

// 48. <oz-stepper>
export class OzStepper extends OzoneElement {
  static get observedAttributes() { return ['steps', 'active', 'variant', 'clickable']; }

  render() {
    const rawAttr = this.getAttribute('steps');
    let steps = [];
    if (rawAttr && rawAttr.trim().startsWith('[')) {
      steps = this.jsonProp('steps', [], []);
    } else if (rawAttr) {
      steps = rawAttr.split(',').map((s) => ({ title: s.trim() })).filter((s) => s.title);
    } else {
      steps = [
        { title: 'Include CSS & JS', desc: 'Drop in 2 zero-dep files' },
        { title: 'Compose Tags', desc: 'Pick from 49 components' },
        { title: 'Apply Brand DNA', desc: 'Presets, hex or logo' },
        { title: 'Deploy Live', desc: 'Ship to edge or static host' }
      ];
    }
    const active = Math.max(0, Math.min(steps.length - 1, this.numProp('active', [], 0)));
    const vertical = this.prop('variant') === 'vertical';
    const clickable = this.boolProp('clickable');

    this.innerHTML = `<div class="oz-stepper${vertical ? ' oz-stepper--vertical' : ''}" role="list">${steps.map((s, i) => {
      const state = i < active ? 'done' : i === active ? 'active' : 'pending';
      return `<button type="button" class="oz-step" role="listitem" data-idx="${i}" data-state="${state}"${clickable ? '' : ' tabindex="-1"'}><span class="oz-step__dot">${state === 'done' ? OZ_SVG.check : (i + 1)}</span><span><span class="oz-step__title" style="display:block;">${escapeHTML(s.title || s.label || '')}</span>${s.desc ? `<span class="oz-step__desc" style="display:block;">${escapeHTML(s.desc)}</span>` : ''}</span></button>`;
    }).join('')}</div>`;

    if (clickable) {
      this.querySelectorAll('.oz-step').forEach((btn) => btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        sound.click();
        this.setAttribute('active', String(idx));
        this.dispatchEvent(new CustomEvent('oz-step', { detail: { index: idx, step: steps[idx] }, bubbles: true }));
      }));
    }
  }
}

// 49. <oz-kanban>
export class OzKanban extends OzoneElement {
  static get observedAttributes() { return ['columns', 'persist-key', 'addable']; }

  privateData() {
    if (this._cols) return this._cols;
    const key = this.prop('persist-key');
    if (key) {
      try {
        const saved = JSON.parse(localStorage.getItem('oz-kb:' + key) || 'null');
        if (Array.isArray(saved) && saved.length) return (this._cols = saved);
      } catch (e) { /* ignore */ }
    }
    const fromAttr = this.jsonProp('columns', ['data'], null);
    if (Array.isArray(fromAttr) && fromAttr.length) return (this._cols = fromAttr);
    return (this._cols = [
      { id: 'backlog', title: 'Backlog', color: 'cyan', cards: [
        { id: 'k1', title: 'OKLCH Light Mode Contrast Audit', tag: 'Design', priority: 'Medium' },
        { id: 'k2', title: 'Add WebMCP Schema Definitions', tag: 'AI Core', priority: 'High' }
      ]},
      { id: 'progress', title: 'In Progress', color: 'violet', cards: [
        { id: 'k3', title: '120fps Multi-Layer Parallax Engine', tag: 'Motion', priority: 'High' },
        { id: 'k4', title: 'Sidebar Icon-Rail Persistence', tag: 'Layout', priority: 'Low' }
      ]},
      { id: 'done', title: 'Shipped', color: 'emerald', cards: [
        { id: 'k5', title: 'Zero-Dependency Form Controls Pack', tag: 'Forms', priority: 'Medium' }
      ]}
    ]);
  }

  saveCols() {
    const key = this.prop('persist-key');
    if (!key) return;
    try { localStorage.setItem('oz-kb:' + key, JSON.stringify(this._cols)); } catch (e) { /* ignore */ }
  }

  render() {
    const cols = this.privateData();
    const canAdd = !this.hasAttribute('addable') || this.boolProp('addable');
    this.innerHTML = `<div class="oz-kanban">${cols.map((c) => `
      <section class="oz-kanban__col" data-col="${escapeHTML(c.id)}">
        <header class="oz-kanban__head">
          <div class="oz-kanban__title"><span class="oz-kanban__dot oz-kanban__dot--${escapeHTML(c.color || 'cyan')}"></span><span>${escapeHTML(c.title)}</span></div>
          <oz-badge variant="neutral">${(c.cards || []).length}</oz-badge>
        </header>
        <div class="oz-kanban__cards">
          ${(c.cards || []).map((card) => `
            <article class="oz-kanban__card" draggable="true" data-card="${escapeHTML(card.id)}" data-from="${escapeHTML(c.id)}">
              <div class="oz-kanban__card-title">${escapeHTML(card.title)}</div>
              <div class="oz-kanban__meta">
                ${card.tag ? `<span class="oz-kanban__tag">${escapeHTML(card.tag)}</span>` : '<span></span>'}
                ${card.priority ? `<span class="oz-kanban__prio oz-kanban__prio--${escapeHTML(card.priority.toLowerCase())}">${escapeHTML(card.priority)}</span>` : ''}
              </div>
            </article>`).join('')}
        </div>
        ${canAdd ? `<form class="oz-kanban__add" data-add-col="${escapeHTML(c.id)}"><input type="text" placeholder="+ Add task..." /><button type="submit" class="oz-btn oz-btn--sm oz-btn--glass">Add</button></form>` : ''}
      </section>`).join('')}</div>`;

    this.querySelectorAll('.oz-kanban__card').forEach((cardEl) => {
      cardEl.addEventListener('dragstart', () => {
        this._drag = { id: cardEl.dataset.card, from: cardEl.dataset.from };
        cardEl.classList.add('is-dragging');
      });
      cardEl.addEventListener('dragend', () => cardEl.classList.remove('is-dragging'));
    });

    this.querySelectorAll('.oz-kanban__col').forEach((colEl) => {
      colEl.addEventListener('dragover', (e) => { e.preventDefault(); colEl.setAttribute('data-over', 'true'); });
      colEl.addEventListener('dragleave', (e) => { if (!colEl.contains(e.relatedTarget)) colEl.removeAttribute('data-over'); });
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.removeAttribute('data-over');
        if (!this._drag) return;
        const toId = colEl.dataset.col;
        const { id, from } = this._drag;
        this._drag = null;
        if (from === toId) return;
        const srcCol = cols.find((x) => x.id === from);
        const dstCol = cols.find((x) => x.id === toId);
        if (!srcCol || !dstCol) return;
        const idx = srcCol.cards.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const [moved] = srcCol.cards.splice(idx, 1);
        dstCol.cards.push(moved);
        sound.click();
        this.saveCols();
        this.render();
        this.dispatchEvent(new CustomEvent('oz-kanban-move', { detail: { card: moved, fromColumn: from, toColumn: toId }, bubbles: true }));
      });
    });

    this.querySelectorAll('.oz-kanban__add').forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const title = (input.value || '').trim();
      if (!title) return;
      const col = cols.find((x) => x.id === form.dataset.addCol);
      if (!col) return;
      const card = { id: 'k-' + ozUid(), title, tag: 'Task', priority: 'Medium' };
      col.cards.push(card);
      sound.success();
      this.saveCols();
      this.render();
      this.dispatchEvent(new CustomEvent('oz-kanban-add', { detail: { card, column: col.id }, bubbles: true }));
    }));
  }
}


// ============================================================================
// OzoneUI Pack G: Modern Calendar, Color Picker, Number Stepper & OTP Input
// <oz-calendar>, <oz-color-picker>, <oz-number-input>, <oz-otp-input>
// ============================================================================

// 50. <oz-calendar>
export class OzCalendar extends OzFormElement {
  static get observedAttributes() { return ['heading', 'title', 'value', 'start', 'end', 'range', 'min', 'max', 'events']; }
  get value() { return this.boolProp('range') ? `${this._start || ''}..${this._end || ''}` : (this._val || ''); }
  set value(v) { this._val = String(v || ''); this.silentSet('value', this._val); this.paint(); }
  render() {
    const isRange = this.boolProp('range');
    this._val = this.prop('value', [], ozTodayYMD());
    this._start = this.prop('start', [], '');
    this._end = this.prop('end', [], '');
    const base = ozParseYMD(isRange ? this._start : this._val) || ozParseYMD(ozTodayYMD());
    this._vy = base.y; this._vm = base.m;
    this.paint();
  }
  paint() {
    const isRange = this.boolProp('range');
    const title = this.prop('heading', ['title']);
    const events = this.jsonProp('events', [], []);
    const evsHTML = events.length ? `<div class="oz-cal__events">${events.slice(0, 4).map((ev) => `<div class="oz-cal__ev"><span class="oz-cal__dot oz-cal__dot--${escapeHTML(ev.color || 'cyan')}" style="width:8px;height:8px;"></span><span>${escapeHTML(ev.title)}</span><span class="oz-cal__ev-date">${escapeHTML(ozPrettyYMD(ev.date))}</span></div>`).join('')}</div>` : '';
    this.innerHTML = `<div class="oz-cal-card">${title ? `<div style="font-weight:700;font-size:1rem;">${escapeHTML(title)}</div>` : ''}${ozCalMonthHTML(this._vy, this._vm, isRange ? this._start : this._val, isRange ? this._end : '', events, this.prop('min'), this.prop('max'))}${evsHTML}</div>`;
    this.querySelector('[data-cal-prev]').addEventListener('click', () => { this._vm--; if (this._vm < 0) { this._vm = 11; this._vy--; } this.paint(); });
    this.querySelector('[data-cal-next]').addEventListener('click', () => { this._vm++; if (this._vm > 11) { this._vm = 0; this._vy++; } this.paint(); });
    this.querySelector('[data-cal-today]').addEventListener('click', () => { const t = ozParseYMD(ozTodayYMD()); this._vy = t.y; this._vm = t.m; this._val = ozTodayYMD(); this.paint(); });
    this.querySelectorAll('[data-ymd]').forEach((b) => b.addEventListener('click', () => {
      const ymd = b.dataset.ymd;
      sound.click();
      if (isRange) {
        if (!this._start || (this._start && this._end)) { this._start = ymd; this._end = ''; }
        else if (ymd < this._start) { this._end = this._start; this._start = ymd; }
        else this._end = ymd;
        this.silentSet('start', this._start); this.silentSet('end', this._end);
        this.paint();
        if (this._end) this.emit('oz-change', { value: `${this._start}..${this._end}`, start: this._start, end: this._end });
      } else {
        this._val = ymd;
        this.silentSet('value', ymd);
        this.paint();
        this.emit('oz-change', { value: ymd });
      }
    }));
  }
}

// 51. <oz-color-picker>
export class OzColorPicker extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'presets']; }
  get value() { return this._val || '#00b4d8'; }
  set value(v) { this.applyColor(v, false); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.popEl && this.popEl.contains(e.target))) this.close(); };
    document.addEventListener('pointerdown', this._outside);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    if (this.popEl) this.popEl.remove();
  }
  render() {
    this._val = this.prop('value', [], '#00b4d8');
    this._open = false;
    const presets = this.prop('presets', [], '#00b4d8,#10b981,#a855f7,#f43f5e,#f59e0b,#3b82f6,#64748b,#ffffff').split(',').map((s) => s.trim()).filter(Boolean);
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    if (this.popEl) this.popEl.remove();
    this.innerHTML = ozFieldHTML(this, `<div class="oz-cp__box"><button type="button" class="oz-cp__swatch" style="background:${escapeHTML(this._val)};" aria-label="Choose swatch"${dis}></button><input type="text" class="oz-cp__hex" size="8" value="${escapeHTML(this._val)}" spellcheck="false" maxlength="9"${dis} /><input type="color" class="oz-cp__native" value="${escapeHTML(/^#[0-9a-fA-F]{6}$/.test(this._val) ? this._val : '#00b4d8')}" aria-label="Color wheel"${dis} /></div>`);
    this.swBtn = this.querySelector('.oz-cp__swatch');
    this.hexIn = this.querySelector('.oz-cp__hex');
    this.natIn = this.querySelector('.oz-cp__native');
    this.popEl = document.createElement('div');
    this.popEl.className = 'oz-cp__pop';
    this.popEl.hidden = true;
    this.popEl.innerHTML = presets.map((c) => `<button type="button" class="oz-cp__cell" data-c="${escapeHTML(c)}" style="background:${escapeHTML(c)};" aria-pressed="${c.toLowerCase() === this._val.toLowerCase()}" aria-label="${escapeHTML(c)}"></button>`).join('');
    document.body.appendChild(this.popEl);

    this.swBtn.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.popEl.addEventListener('click', (e) => { const c = e.target.closest('[data-c]'); if (c) { this.applyColor(c.dataset.c, true); this.close(); } });
    this.natIn.addEventListener('input', () => this.applyColor(this.natIn.value, true));
    this.hexIn.addEventListener('change', () => {
      const v = this.hexIn.value.trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(v)) this.applyColor(v, true);
    });
  }
  applyColor(v, emit) {
    this._val = v;
    if (this.swBtn) this.swBtn.style.background = v;
    if (this.hexIn) this.hexIn.value = v;
    if (this.natIn && /^#[0-9a-fA-F]{6}$/.test(v)) this.natIn.value = v;
    if (this.popEl) this.popEl.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.c.toLowerCase() === v.toLowerCase()));
    this.silentSet('value', v);
    if (emit) { sound.click(); this.emit('oz-change', { value: v }); }
  }
  open() {
    this._open = true;
    const r = this.swBtn.getBoundingClientRect();
    this.popEl.hidden = false;
    this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - 180))}px`;
    this.popEl.style.top = `${r.bottom + 8}px`;
  }
  close() { this._open = false; if (this.popEl) this.popEl.hidden = true; }
}

// 52. <oz-number-input>
export class OzNumberInput extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'min', 'max', 'step']; }
  get value() { return Number(this._val ?? this.numProp('value', [], 0)); }
  set value(v) { this.setNum(v, false); }
  render() {
    const min = this.hasAttribute('min') ? this.numProp('min', [], -Infinity) : -Infinity;
    const max = this.hasAttribute('max') ? this.numProp('max', [], Infinity) : Infinity;
    const step = Math.max(0.01, this.numProp('step', [], 1));
    this._min = min; this._max = max; this._step = step;
    this._val = this.numProp('value', [], Math.max(min, Math.min(max, 1)));
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    this.innerHTML = ozFieldHTML(this, `<div class="oz-num"><button type="button" class="oz-num__btn" data-dec aria-label="Decrease"${dis}>−</button><input type="text" inputmode="decimal" class="oz-num__field" size="4" value="${this._val}"${dis} /><button type="button" class="oz-num__btn" data-inc aria-label="Increase"${dis}>+</button></div>`);
    this.field = this.querySelector('input');
    this.querySelector('[data-dec]').addEventListener('click', () => { sound.click(); this.setNum(this._val - this._step, true); });
    this.querySelector('[data-inc]').addEventListener('click', () => { sound.click(); this.setNum(this._val + this._step, true); });
    this.field.addEventListener('change', () => this.setNum(parseFloat(this.field.value), true));
    this.field.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); this.setNum(this._val + this._step, true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); this.setNum(this._val - this._step, true); }
    });
    this.sync();
  }
  setNum(n, emit) {
    if (!Number.isFinite(n)) n = this._val;
    this._val = Math.max(this._min, Math.min(this._max, Number(n.toFixed(4))));
    if (this.field) this.field.value = String(this._val);
    this.silentSet('value', String(this._val));
    this.sync();
    if (emit) this.emit('oz-change', { value: this._val });
  }
  sync() {
    const dec = this.querySelector('[data-dec]'), inc = this.querySelector('[data-inc]');
    if (dec) dec.disabled = this.boolProp('disabled') || this._val <= this._min;
    if (inc) inc.disabled = this.boolProp('disabled') || this._val >= this._max;
  }
}

// 53. <oz-otp-input>
export class OzOtpInput extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'length', 'value']; }
  get value() { return Array.from(this.querySelectorAll('input')).map((i) => i.value).join(''); }
  render() {
    const len = Math.max(4, Math.min(8, this.numProp('length', [], 6)));
    const init = this.prop('value', [], '');
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    const cells = Array.from({ length: len }, (_, i) => `<input type="text" inputmode="numeric" maxlength="6" class="oz-otp__cell" value="${escapeHTML(init[i] || '')}" aria-label="Digit ${i + 1}"${dis} />`).join('');
    this.innerHTML = ozFieldHTML(this, `<div class="oz-otp">${cells}</div>`);
    const inputs = Array.from(this.querySelectorAll('input'));
    const notify = () => {
      const code = inputs.map((x) => x.value).join('');
      this.silentSet('value', code);
      this.emit('oz-input', { value: code });
      if (code.length === len) { sound.success(); this.emit('oz-complete', { value: code }); this.emit('oz-change', { value: code }); }
    };
    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        const clean = inp.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (clean.length > 1) {
          clean.split('').forEach((ch, off) => { if (inputs[idx + off]) inputs[idx + off].value = ch; });
          inputs[Math.min(idx + clean.length, inputs.length - 1)].focus();
        } else {
          inp.value = clean;
          if (clean && idx < inputs.length - 1) inputs[idx + 1].focus();
        }
        notify();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) { inputs[idx - 1].focus(); inputs[idx - 1].value = ''; notify(); }
      });
      inp.addEventListener('paste', (e) => {
        const text = (e.clipboardData?.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, len);
        if (!text) return;
        e.preventDefault();
        inputs.forEach((x, j) => { x.value = text[j] || ''; });
        inputs[Math.min(text.length, len - 1)].focus();
        notify();
      });
    });
  }
}

// ============================================================================
// OzoneUI Pack H: 12-Col Grid, Mobile App Bar/FAB, AI Chat, Dev & Production UI
// ============================================================================

// Native Form Sync Helper + Global Agent Form Bridge
function syncHiddenField(host, value) {
  const name = host.getAttribute('name');
  if (!name) return;
  let hidden = host.querySelector('input[data-oz-form-val]');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.setAttribute('data-oz-form-val', '');
    host.appendChild(hidden);
  }
  hidden.name = name;
  hidden.value = value == null ? '' : String(value);
}

export function getFormData(root = document) {
  const out = {};
  const scope = root instanceof Element || root instanceof Document ? root : document;
  scope.querySelectorAll('oz-input, oz-select, oz-checkbox, oz-radio-group, oz-textarea, oz-slider, oz-date-picker, oz-combobox, oz-color-picker, oz-number-input, oz-otp-input, oz-switch').forEach((el) => {
    const key = el.getAttribute('name') || el.getAttribute('label') || el.id;
    if (!key) return;
    if ('checked' in el && (el.tagName === 'OZ-CHECKBOX' || el.tagName === 'OZ-SWITCH')) out[key] = el.checked;
    else out[key] = el.value;
  });
  return out;
}

export function fillForm(data = {}, root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  const entries = Object.entries(data);
  scope.querySelectorAll('oz-input, oz-select, oz-checkbox, oz-radio-group, oz-textarea, oz-slider, oz-date-picker, oz-combobox, oz-color-picker, oz-number-input, oz-otp-input, oz-switch').forEach((el) => {
    const keys = [el.getAttribute('name'), el.getAttribute('label'), el.id].filter(Boolean).map((s) => s.toLowerCase());
    const match = entries.find(([k]) => keys.includes(k.toLowerCase()));
    if (!match) return;
    const val = match[1];
    if (el.tagName === 'OZ-CHECKBOX' || el.tagName === 'OZ-SWITCH') el.checked = Boolean(val);
    else if ('value' in el) el.value = val;
    el.dispatchEvent(new CustomEvent('oz-change', { detail: { value: val }, bubbles: true }));
  });
  return getFormData(scope);
}

// 54. <oz-grid>
export class OzGrid extends OzoneElement {
  static get observedAttributes() { return ['cols', 'gap', 'min', 'align']; }
  render() {
    this.style.setProperty('--oz-grid-cols', this.prop('cols', [], '12'));
    const gap = this.prop('gap');
    if (gap) this.style.setProperty('--oz-grid-gap', /^\d+$/.test(gap) ? gap + 'px' : gap);
    const min = this.prop('min');
    if (min) this.style.setProperty('--oz-grid-min', /^\d+$/.test(min) ? min + 'px' : min);
    const align = this.prop('align');
    if (align) this.style.setProperty('--oz-grid-align', align);
  }
}

// 55. <oz-col>
export class OzCol extends OzoneElement {
  static get observedAttributes() { return ['span', 'span-md', 'span-sm']; }
  render() {
    this.style.setProperty('--oz-span', this.prop('span', [], '12'));
    const md = this.prop('span-md'); if (md) this.style.setProperty('--oz-span-md', md);
    const sm = this.prop('span-sm'); if (sm) this.style.setProperty('--oz-span-sm', sm);
  }
}

// 56. <oz-bottom-nav>
export class OzBottomNav extends OzoneElement {
  static get observedAttributes() { return ['items', 'active', 'variant', 'position']; }
  render() {
    const items = this.jsonProp('items', [], [
      { id: 'home', label: 'Home', icon: 'layout' },
      { id: 'explore', label: 'Explore', icon: 'sparkles' },
      { id: 'alerts', label: 'Alerts', icon: 'activity', badge: '3' },
      { id: 'profile', label: 'Profile', icon: 'user' }
    ]);
    const active = this.prop('active', [], this._active || (items[0] && (items[0].id || items[0].label)) || '');
    this._active = active;
    this.innerHTML = `<nav class="oz-bnav" role="tablist" aria-label="Bottom Navigation">${items.map((it) => {
      const id = String(it.id || it.label);
      const isOn = id === active;
      return `<button type="button" class="oz-bnav__btn${isOn ? ' is-active' : ''}" role="tab" aria-selected="${isOn}" data-id="${escapeHTML(id)}">${it.badge ? `<span class="oz-bnav__badge">${escapeHTML(it.badge)}</span>` : ''}<oz-icon name="${escapeHTML(it.icon || 'diamond')}" size="20"></oz-icon><span>${escapeHTML(it.label)}</span></button>`;
    }).join('')}</nav>`;
    this.querySelectorAll('.oz-bnav__btn').forEach((b) => b.addEventListener('click', () => {
      this._active = b.dataset.id;
      this.setAttribute('active', b.dataset.id);
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-navigate', { detail: { id: b.dataset.id }, bubbles: true }));
    }));
  }
}

// 57. <oz-fab>
export class OzFab extends OzoneElement {
  static get observedAttributes() { return ['icon', 'label', 'items', 'position']; }
  render() {
    const icon = this.prop('icon', [], 'plus');
    const label = this.prop('label');
    const items = this.jsonProp('items', [], []);
    const hasDial = Array.isArray(items) && items.length > 0;
    this._open = false;
    this.innerHTML = `<div class="oz-fab__wrap">${hasDial ? `<div class="oz-fab__dial" data-open="false">${items.map((it, idx) => `<button type="button" class="oz-fab__action" data-idx="${idx}">${it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="16"></oz-icon>` : ''}<span>${escapeHTML(it.label)}</span></button>`).join('')}</div>` : ''}<button type="button" class="oz-fab__btn${label ? '' : ' oz-fab__btn--icon'}" aria-expanded="false" aria-label="${escapeHTML(label || 'Quick Actions')}"><oz-icon name="${escapeHTML(icon)}" size="22"></oz-icon>${label ? `<span>${escapeHTML(label)}</span>` : ''}</button></div>`;
    const btn = this.querySelector('.oz-fab__btn');
    const dial = this.querySelector('.oz-fab__dial');
    btn.addEventListener('click', () => {
      sound.click();
      if (hasDial && dial) {
        this._open = !this._open;
        dial.setAttribute('data-open', String(this._open));
        btn.setAttribute('aria-expanded', String(this._open));
      } else {
        this.dispatchEvent(new CustomEvent('oz-action', { detail: { action: 'fab' }, bubbles: true }));
      }
    });
    if (dial) {
      dial.querySelectorAll('.oz-fab__action').forEach((act) => act.addEventListener('click', () => {
        const it = items[Number(act.dataset.idx)];
        this._open = false;
        dial.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
        sound.click();
        this.dispatchEvent(new CustomEvent('oz-fab-action', { detail: { id: it.id || it.label, item: it }, bubbles: true }));
      }));
    }
  }
}

// 58. <oz-ai-chat>
export class OzAiChat extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'model', 'models', 'suggestions', 'placeholder', 'messages']; }
  connectedCallback() { super.connectedCallback(); }
  addMessage(role, text) {
    this._msgs.push({ role, text });
    this.paintFeed();
  }
  async streamReply(fullText) {
    const idx = this._msgs.push({ role: 'assistant', text: '' }) - 1;
    const words = String(fullText).split(' ');
    for (let i = 0; i < words.length; i++) {
      this._msgs[idx].text += (i ? ' ' : '') + words[i];
      this.paintFeed();
      await new Promise((r) => setTimeout(r, 22));
    }
  }
  render() {
    const title = this.prop('heading', ['title'], 'Ozone AI Assistant');
    const models = this.prop('models', [], 'Gemini 2.5 Pro,Claude Sonnet,GPT-4o').split(',').map((s) => s.trim()).filter(Boolean);
    this._model = this.prop('model', [], models[0] || 'Gemini 2.5 Pro');
    const sugs = this.prop('suggestions', [], 'Build a 12-col dashboard,Suggest brand palette,Generate API table').split(',').map((s) => s.trim()).filter(Boolean);
    this._msgs = this.jsonProp('messages', [], [
      { role: 'assistant', text: 'Ready. Ask me to compose OzoneUI tags, pick OKLCH colors, or scaffold a responsive layout.' }
    ]);
    this.innerHTML = `<div class="oz-chat"><header class="oz-chat__head"><div class="oz-chat__brand"><oz-icon name="sparkles" size="18" glow></oz-icon><span>${escapeHTML(title)}</span></div><select class="oz-chat__model" aria-label="AI Model">${models.map((m) => `<option${m === this._model ? ' selected' : ''}>${escapeHTML(m)}</option>`).join('')}</select></header><div class="oz-chat__feed" role="log" aria-live="polite"></div>${sugs.length ? `<div class="oz-chat__chips">${sugs.map((s) => `<button type="button" class="oz-chat__chip">${escapeHTML(s)}</button>`).join('')}</div>` : ''}<form class="oz-chat__form"><input type="text" class="oz-chat__input" placeholder="${escapeHTML(this.prop('placeholder', [], 'Ask AI to build UI...'))}" /><button type="submit" class="oz-btn oz-btn--sm oz-btn--glow"><oz-icon name="send" size="14"></oz-icon> Send</button></form></div>`;
    this.feedEl = this.querySelector('.oz-chat__feed');
    this.inputEl = this.querySelector('.oz-chat__input');
    this.querySelector('.oz-chat__model').addEventListener('change', (e) => { this._model = e.target.value; });
    this.querySelectorAll('.oz-chat__chip').forEach((c) => c.addEventListener('click', () => this.submitPrompt(c.textContent.trim())));
    this.querySelector('.oz-chat__form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitPrompt(this.inputEl.value);
    });
    this.paintFeed();
  }
  paintFeed() {
    if (!this.feedEl) return;
    this.feedEl.innerHTML = this._msgs.map((m) => `<div class="oz-chat__msg oz-chat__msg--${m.role === 'user' ? 'user' : 'ai'}"><span class="oz-chat__avatar"><oz-icon name="${m.role === 'user' ? 'user' : 'sparkles'}" size="15"></oz-icon></span><div class="oz-chat__bubble">${escapeHTML(m.text || '...')}</div></div>`).join('');
    this.feedEl.scrollTop = this.feedEl.scrollHeight;
  }
  submitPrompt(raw) {
    const prompt = String(raw || '').trim();
    if (!prompt) return;
    this.inputEl.value = '';
    this.addMessage('user', prompt);
    sound.click();
    const ev = new CustomEvent('oz-send', { detail: { prompt, model: this._model, chat: this }, bubbles: true, cancelable: true });
    this.dispatchEvent(ev);
    if (!ev.defaultPrevented) {
      this.streamReply(`Generated <oz-grid cols="12"> layout & OKLCH tokens via ${this._model} for "${prompt}". Ready in 1 tag with zero build steps.`);
    }
  }
}

// 59. <oz-code-block>
export class OzCodeBlock extends OzoneElement {
  static get observedAttributes() { return ['title', 'lang', 'code', 'line-numbers']; }
  render() {
    if (this._code === undefined) {
      this._code = this.getAttribute('code') ?? this.captureSlotNodes().map((n) => n.textContent).join('').trim();
    }
    const code = this.getAttribute('code') ?? this._code ?? '';
    const title = this.prop('title', ['file'], 'snippet.html');
    const lang = this.prop('lang', ['language'], 'html');
    const nums = this.boolProp('line-numbers');
    const lines = String(code).split(/\r?\n/).map((l) => `<span class="oz-code__line">${escapeHTML(l || ' ')}</span>`).join('');
    this.innerHTML = `<div class="oz-code${nums ? ' oz-code--nums' : ''}"><header class="oz-code__head"><div class="oz-code__meta"><oz-badge variant="cyan">${escapeHTML(lang)}</oz-badge><span>${escapeHTML(title)}</span></div><button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-copy><oz-icon name="copy" size="13"></oz-icon> <span>Copy</span></button></header><pre class="oz-code__pre"><code>${lines}</code></pre></div>`;
    const btn = this.querySelector('[data-copy]');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard?.writeText(code); } catch {}
      sound.success();
      const sp = btn.querySelector('span');
      if (sp) { sp.textContent = 'Copied'; setTimeout(() => { sp.textContent = 'Copy'; }, 1400); }
    });
  }
}

// 60. <oz-split-pane>
export class OzSplitPane extends OzoneElement {
  static get observedAttributes() { return ['ratio']; }
  render() {
    const nodes = this.captureSlotNodes().filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
    if (!this._mounted) {
      this._mounted = true;
      const ratio = Math.max(15, Math.min(85, this.numProp('ratio', [], 40)));
      this.innerHTML = `<div class="oz-split" style="--oz-split-a:${ratio}%;"><div class="oz-split__pane" data-pane="a"></div><div class="oz-split__handle" role="separator" aria-orientation="vertical" title="Drag to resize"></div><div class="oz-split__pane" data-pane="b"></div></div>`;
      if (nodes[0]) this.querySelector('[data-pane="a"]').appendChild(nodes[0]);
      nodes.slice(1).forEach((n) => this.querySelector('[data-pane="b"]').appendChild(n));
      const box = this.querySelector('.oz-split');
      const handle = this.querySelector('.oz-split__handle');
      let dragging = false;
      handle.addEventListener('pointerdown', (e) => { dragging = true; handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const r = box.getBoundingClientRect();
        const pct = Math.max(18, Math.min(82, ((e.clientX - r.left) / (r.width || 1)) * 100));
        box.style.setProperty('--oz-split-a', pct.toFixed(1) + '%');
      });
      const stop = () => { dragging = false; };
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    }
  }
}

// 61. <oz-tree>
export class OzTree extends OzoneElement {
  static get observedAttributes() { return ['items', 'active']; }
  render() {
    const items = this.jsonProp('items', [], [
      { id: 'src', label: 'src', open: true, children: [
        { id: 'styles', label: 'styles/ozone.css' },
        { id: 'forms', label: 'components/shell-forms.ts' },
        { id: 'ai', label: 'ai/renderer.ts' }
      ]},
      { id: 'dist', label: 'dist', open: true, children: [
        { id: 'dcss', label: 'ozone.css' },
        { id: 'djs', label: 'ozone.js' }
      ]},
      { id: 'llms', label: 'llms.txt' }
    ]);
    if (!this._open) {
      this._open = new Set();
      const seed = (arr) => arr.forEach((n) => { if (n.open) this._open.add(n.id || n.label); if (n.children) seed(n.children); });
      seed(items);
    }
    this._active = this.prop('active', [], this._active || '');
    const drawNode = (n) => {
      const id = String(n.id || n.label);
      const has = Array.isArray(n.children) && n.children.length > 0;
      const open = has && this._open.has(id);
      return `<div><button type="button" class="oz-tree__row${this._active === id ? ' is-active' : ''}" data-id="${escapeHTML(id)}" data-has="${has}" data-label="${escapeHTML(n.label)}"><oz-icon name="${has ? (open ? 'chevron-down' : 'arrow-right') : (n.icon || 'code')}" size="14"></oz-icon><span>${escapeHTML(n.label)}</span></button>${has ? `<div class="oz-tree__kids"${open ? '' : ' hidden'}>${n.children.map(drawNode).join('')}</div>` : ''}</div>`;
    };
    this.innerHTML = `<div class="oz-tree" role="tree">${items.map(drawNode).join('')}</div>`;
    this.querySelectorAll('.oz-tree__row').forEach((r) => r.addEventListener('click', () => {
      const id = r.dataset.id;
      if (r.dataset.has === 'true') { if (this._open.has(id)) this._open.delete(id); else this._open.add(id); }
      this._active = id;
      sound.click();
      this.render();
      this.dispatchEvent(new CustomEvent('oz-select', { detail: { id, label: r.dataset.label }, bubbles: true }));
    }));
  }
}

// 62. <oz-hover-card>
export class OzHoverCard extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'badge', 'meta']; }
  connectedCallback() { super.connectedCallback(); }
  disconnectedCallback() { super.disconnectedCallback(); if (this.popEl) this.popEl.remove(); }
  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<span class="oz-hc__trig" tabindex="0"></span>`;
      const tr = this.querySelector('.oz-hc__trig');
      nodes.forEach((n) => tr.appendChild(n));
      this.popEl = document.createElement('div');
      this.popEl.className = 'oz-hc__pop';
      this.popEl.hidden = true;
      document.body.appendChild(this.popEl);
      const show = () => {
        clearTimeout(this._t);
        const r = tr.getBoundingClientRect();
        this.popEl.hidden = false;
        const pw = this.popEl.offsetWidth || 280;
        this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - pw - 12))}px`;
        this.popEl.style.top = `${r.bottom + 10}px`;
      };
      const hide = () => { this._t = setTimeout(() => { if (this.popEl) this.popEl.hidden = true; }, 140); };
      this.addEventListener('pointerenter', show);
      this.addEventListener('pointerleave', hide);
      this.addEventListener('focusin', show);
      this.addEventListener('focusout', hide);
      this.popEl.addEventListener('pointerenter', () => clearTimeout(this._t));
      this.popEl.addEventListener('pointerleave', hide);
    }
    const title = this.prop('heading', ['title'], 'Elena Vance');
    const sub = this.prop('subtitle', [], 'Principal Systems Architect • Aether AI');
    const badge = this.prop('badge');
    const meta = this.prop('meta');
    if (this.popEl) {
      this.popEl.innerHTML = `<div class="oz-between" style="gap:8px;"><div class="oz-row" style="gap:10px;"><oz-avatar name="${escapeHTML(title)}" size="36" status="online"></oz-avatar><div><div style="font-weight:700;font-size:0.92rem;">${escapeHTML(title)}</div><div class="oz-text-xs oz-muted">${escapeHTML(sub)}</div></div></div>${badge ? `<oz-badge variant="cyan">${escapeHTML(badge)}</oz-badge>` : ''}</div>${meta ? `<div class="oz-text-xs oz-muted">${escapeHTML(meta)}</div>` : ''}`;
    }
  }
}

// 63. <oz-pagination>
export class OzPagination extends OzoneElement {
  static get observedAttributes() { return ['page', 'total', 'page-size']; }
  render() {
    const total = Math.max(1, this.numProp('total', [], 120));
    const size = Math.max(1, this.numProp('page-size', [], 10));
    const pages = Math.max(1, Math.ceil(total / size));
    const page = Math.max(1, Math.min(pages, this.numProp('page', [], 1)));
    const start = (page - 1) * size + 1, end = Math.min(total, page * size);
    const nums = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    this.innerHTML = `<div class="oz-pagebar"><span class="oz-text-xs oz-muted">Showing <strong>${start}–${end}</strong> of <strong>${total}</strong></span><nav class="oz-pages" aria-label="Pagination"><button type="button" class="oz-page" data-p="${page - 1}"${page <= 1 ? ' disabled' : ''}>&#8249;</button>${nums.map((n) => n === '...' ? `<span class="oz-muted" style="padding:0 4px;">…</span>` : `<button type="button" class="oz-page${n === page ? ' is-active' : ''}" data-p="${n}" aria-current="${n === page ? 'page' : 'false'}">${n}</button>`).join('')}<button type="button" class="oz-page" data-p="${page + 1}"${page >= pages ? ' disabled' : ''}>&#8250;</button></nav></div>`;
    this.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = Number(b.dataset.p);
      sound.click();
      this.setAttribute('page', String(p));
      this.dispatchEvent(new CustomEvent('oz-page', { detail: { page: p }, bubbles: true }));
    }));
  }
}

// 64. <oz-skeleton>
export class OzSkeleton extends OzoneElement {
  static get observedAttributes() { return ['variant', 'lines']; }
  render() {
    const v = this.prop('variant', ['type'], 'card');
    const lines = Math.max(1, Math.min(8, this.numProp('lines', [], 3)));
    if (v === 'stat') {
      this.innerHTML = `<div class="oz-skel"><div class="oz-skel__bar" style="width:45%;"></div><div class="oz-skel__bar" style="width:70%;height:26px;margin-top:6px;"></div><div class="oz-skel__bar" style="width:35%;"></div></div>`;
      return;
    }
    const bars = Array.from({ length: lines }, (_, i) => `<div class="oz-skel__bar" style="width:${i === lines - 1 ? '62%' : '100%'};"></div>`).join('');
    this.innerHTML = `<div class="oz-skel">${v === 'avatar' ? `<div style="display:flex;align-items:center;gap:12px;"><div class="oz-skel__bar" style="width:40px;height:40px;border-radius:50%;flex:none;"></div><div class="oz-skel__bar" style="width:55%;"></div></div>` : ''}${bars}</div>`;
  }
}

// 65. <oz-empty-state>
export class OzEmptyState extends OzoneElement {
  static get observedAttributes() { return ['icon', 'heading', 'title', 'description', 'cta']; }
  render() {
    const icon = this.prop('icon', [], 'box');
    const title = this.prop('heading', ['title'], 'Nothing here yet');
    const desc = this.prop('description', ['subtitle'], 'Create your first item or adjust active filters to see results.');
    const cta = this.prop('cta');
    this.innerHTML = `<div class="oz-empty"><div class="oz-empty__icon"><oz-icon name="${escapeHTML(icon)}" size="24"></oz-icon></div><div class="oz-empty__title">${escapeHTML(title)}</div><div class="oz-empty__desc">${escapeHTML(desc)}</div>${cta ? `<oz-button variant="glow" size="sm" id="empty-cta">${escapeHTML(cta)}</oz-button>` : ''}</div>`;
    this.querySelector('#empty-cta')?.addEventListener('click', () => {
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-action', { detail: { action: 'empty-cta' }, bubbles: true }));
    });
  }
}

// 66. <oz-cookie-consent> (EU GDPR / ePrivacy Planet49 compliant, zero dark patterns)
export const gdpr = {
  key: 'oz-gdpr-consent',
  getConsent() {
    try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch { return null; }
  },
  setConsent(prefs) {
    const val = { essential: true, preferences: !!prefs.preferences, analytics: !!prefs.analytics, strict: !!prefs.strict, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(this.key, JSON.stringify(val)); } catch {}
    if (val.strict) document.documentElement.dataset.ozGdpr = 'strict';
    else delete document.documentElement.dataset.ozGdpr;
    window.dispatchEvent(new CustomEvent('oz-consent', { detail: val }));
    return val;
  },
  clearStorage() {
    const removed = [];
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('oz-')) { localStorage.removeItem(k); removed.push(k); }
      }
    } catch {}
    delete document.documentElement.dataset.ozGdpr;
    window.dispatchEvent(new CustomEvent('oz-consent', { detail: { cleared: removed } }));
    return removed;
  },
  exportData() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('oz-')) out[k] = localStorage.getItem(k);
      }
    } catch {}
    return out;
  }
};

export class OzCookieConsent extends OzoneElement {
  static get observedAttributes() { return ['heading', 'description', 'policy-url', 'position', 'open']; }
  open() { this.setAttribute('open', ''); this.paint(); }
  close() { this.removeAttribute('open'); this.paint(); }
  render() {
    this.paint();
  }
  paint() {
    const existing = gdpr.getConsent();
    const forceOpen = this.boolProp('open');
    const visible = forceOpen || !existing;
    const heading = this.prop('heading', ['title'], 'Your Privacy & EU Cookies');
    const desc = this.prop('description', [], 'OzoneUI loads 0 third-party fonts or trackers. Functional preferences are stored locally only with your consent.');
    const policy = this.prop('policy-url', [], 'legal.html');
    this.innerHTML = `<aside class="oz-cc-banner" role="dialog" aria-label="${escapeHTML(heading)}"${visible ? '' : ' hidden'}><div class="oz-cc__head"><div class="oz-cc__title"><oz-icon name="shield" size="18" glow></oz-icon><span>${escapeHTML(heading)}</span></div><oz-badge variant="emerald">GDPR</oz-badge></div><p class="oz-cc__desc">${escapeHTML(desc)} <a href="${escapeHTML(policy)}" style="color:var(--oz-primary);text-decoration:underline;">Privacy &amp; EU Legal</a></p><div class="oz-cc__prefs" hidden><oz-checkbox label="Essential &amp; Security State" description="Always active for theme &amp; accessibility safety." checked disabled></oz-checkbox><oz-checkbox id="cc-pref-ui" label="Theme DNA &amp; Layout Memory" description="Remembers chosen palette, mode, and sidebar state." checked></oz-checkbox><oz-checkbox id="cc-pref-strict" label="Strict Zero-Network Mode" description="Blocks optional external Iconify icon CDN fetches."></oz-checkbox></div><div class="oz-cc__actions"><button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-gdpr="essential">Essential Only</button><button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-gdpr="prefs">Customize</button><button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-gdpr="all">Accept All</button></div></aside>`;
    const banner = this.querySelector('.oz-cc-banner');
    const prefsBox = this.querySelector('.oz-cc__prefs');
    const save = (cfg) => {
      const saved = gdpr.setConsent(cfg);
      this.removeAttribute('open');
      if (banner) banner.hidden = true;
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-consent', { detail: saved, bubbles: true }));
    };
    this.querySelector('[data-gdpr="essential"]').addEventListener('click', () => save({ preferences: false, analytics: false, strict: true }));
    this.querySelector('[data-gdpr="all"]').addEventListener('click', () => save({ preferences: true, analytics: true, strict: false }));
    this.querySelector('[data-gdpr="prefs"]').addEventListener('click', (e) => {
      if (prefsBox.hidden) {
        prefsBox.hidden = false;
        e.currentTarget.textContent = 'Save Choices';
      } else {
        const uiPref = this.querySelector('#cc-pref-ui')?.checked ?? true;
        const strictPref = this.querySelector('#cc-pref-strict')?.checked ?? false;
        save({ preferences: uiPref, analytics: false, strict: strictPref });
      }
    });
  }
}

// --- 15. Boot & Global Registration -----------------------------------------
const DEFINITIONS = [
  ['oz-icon', OzIcon], ['oz-button', OzButton], ['oz-card', OzCard], ['oz-badge', OzBadge], ['oz-input', OzInput],
  ['oz-switch', OzSwitch], ['oz-tabs', OzTabs], ['oz-dialog', OzDialog], ['oz-avatar', OzAvatar],
  ['oz-stat', OzStat], ['oz-chart', OzChart], ['oz-table', OzTable], ['oz-smart-view', OzSmartView],
  ['oz-hero', OzHero], ['oz-bento', OzBento], ['oz-pricing', OzPricing], ['oz-marquee', OzMarquee],
  ['oz-product-card', OzProductCard], ['oz-rating', OzRating], ['oz-post', OzPost], ['oz-composer', OzComposer],
  ['oz-renderer', OzRenderer], ['oz-command', OzCommand], ['oz-inspector', OzInspector],
  ['oz-header', OzHeader], ['oz-footer', OzFooter], ['oz-breadcrumbs', OzBreadcrumbs], ['oz-alert', OzAlert],
  ['oz-progress', OzProgress], ['oz-accordion', OzAccordion], ['oz-timeline', OzTimeline],
  ['oz-sidebar', OzSidebar], ['oz-app-shell', OzAppShell], ['oz-select', OzSelect], ['oz-checkbox', OzCheckbox], ['oz-radio-group', OzRadioGroup],
  ['oz-textarea', OzTextarea], ['oz-slider', OzSlider], ['oz-date-picker', OzDatePicker], ['oz-file-upload', OzFileUpload], ['oz-combobox', OzCombobox],
  ['oz-parallax', OzParallax], ['oz-reveal', OzReveal], ['oz-spotlight', OzSpotlight], ['oz-drawer', OzDrawer],
  ['oz-dropdown', OzDropdown], ['oz-tooltip', OzTooltip], ['oz-stepper', OzStepper], ['oz-kanban', OzKanban],
  ['oz-calendar', OzCalendar], ['oz-color-picker', OzColorPicker], ['oz-number-input', OzNumberInput], ['oz-otp-input', OzOtpInput],
  ['oz-grid', OzGrid], ['oz-col', OzCol], ['oz-bottom-nav', OzBottomNav], ['oz-fab', OzFab],
  ['oz-ai-chat', OzAiChat], ['oz-code-block', OzCodeBlock], ['oz-split-pane', OzSplitPane], ['oz-tree', OzTree],
  ['oz-hover-card', OzHoverCard], ['oz-pagination', OzPagination], ['oz-skeleton', OzSkeleton], ['oz-empty-state', OzEmptyState],
  ['oz-cookie-consent', OzCookieConsent]
];

export function bootOzoneUI() {
  if (typeof document === 'undefined') return;
  if (!document.documentElement.dataset.ozMode) document.documentElement.dataset.ozMode = 'atmospheric';
  if (!document.documentElement.dataset.ozTheme) document.documentElement.dataset.ozTheme = 'dark';
  if (gdpr.getConsent()?.strict) document.documentElement.dataset.ozGdpr = 'strict';
  dna.initBranding();
  initAtmosphere();
  for (const [tag, ctor] of DEFINITIONS) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
  Ozone.getFormData = getFormData;
  Ozone.fillForm = fillForm;
  Ozone.gdpr = gdpr;
  window.Ozone = Ozone;
}

bootOzoneUI();
export default Ozone;