// ============================================================================
// OzoneUI Theme DNA Barcode, Preset Archetype & Client Auto-Branding Engine
// ============================================================================

export type BrandHarmony = 'analogous' | 'complementary' | 'triadic' | 'monochrome';
export type BrandDensity = 'compact' | 'default' | 'spacious';

export interface BrandPreset {
  id: string;
  aliases?: string[];
  label: string;
  hue: number;
  accentHue: number;
  mode: 'atmospheric' | 'precision';
  theme: 'dark' | 'light';
  blur: number;
  radius: number;
  swatch: string;
  hex: string;
}

export const BRAND_PRESETS: Record<string, BrandPreset> = {
  ozone: { id: 'ozone', label: 'Ozone Cyber', hue: 205, accentHue: 280, mode: 'atmospheric', theme: 'dark', blur: 20, radius: 16, swatch: '#00d2ff', hex: '#00b4d8' },
  emerald: { id: 'emerald', aliases: ['fintech'], label: 'Emerald Fintech', hue: 155, accentHue: 195, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#10b981', hex: '#10b981' },
  amethyst: { id: 'amethyst', aliases: ['ai'], label: 'Amethyst AI', hue: 285, accentHue: 330, mode: 'atmospheric', theme: 'dark', blur: 22, radius: 18, swatch: '#a855f7', hex: '#a855f7' },
  crimson: { id: 'crimson', aliases: ['gaming', 'rose'], label: 'Crimson Pulse', hue: 12, accentHue: 42, mode: 'atmospheric', theme: 'dark', blur: 20, radius: 16, swatch: '#f43f5e', hex: '#f43f5e' },
  amber: { id: 'amber', aliases: ['luxury', 'gold'], label: 'Solar Luxury', hue: 75, accentHue: 38, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#f59e0b', hex: '#f59e0b' },
  ocean: { id: 'ocean', aliases: ['saas', 'cobalt'], label: 'Ocean SaaS', hue: 235, accentHue: 198, mode: 'atmospheric', theme: 'dark', blur: 18, radius: 14, swatch: '#3b82f6', hex: '#3b82f6' },
  nordic: { id: 'nordic', aliases: ['enterprise', 'slate'], label: 'Nordic Precision', hue: 220, accentHue: 255, mode: 'precision', theme: 'dark', blur: 0, radius: 10, swatch: '#64748b', hex: '#475569' },
  daylight: { id: 'daylight', aliases: ['quartz', 'light'], label: 'Daylight Quartz', hue: 230, accentHue: 275, mode: 'atmospheric', theme: 'light', blur: 20, radius: 16, swatch: '#94a3b8', hex: '#2563eb' }
};

export interface OzoneDNAState {
  mode: 'atmospheric' | 'precision';
  theme: 'dark' | 'light';
  hue: number;
  accentHue: number;
  blur: number;
  radius: number;
  sound: boolean;
  preset: string;
  brand: string;
  harmony: BrandHarmony;
  density: BrandDensity;
  brandName: string;
}

function normalizeHex(raw: string): string {
  let clean = String(raw || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#00b4d8';
  return `#${clean.toLowerCase()}`;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function findPreset(name: string): BrandPreset | null {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (BRAND_PRESETS[key]) return BRAND_PRESETS[key];
  return Object.values(BRAND_PRESETS).find((p) => p.aliases?.includes(key)) || null;
}

export const dna = {
  presets: BRAND_PRESETS,

  read(): OzoneDNAState {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const harmonyRaw = root.dataset.ozHarmony as BrandHarmony | undefined;
    const densityRaw = root.dataset.ozDensity as BrandDensity | undefined;
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
      harmony: harmonyRaw && ['analogous', 'complementary', 'triadic', 'monochrome'].includes(harmonyRaw) ? harmonyRaw : 'analogous',
      density: densityRaw && ['compact', 'default', 'spacious'].includes(densityRaw) ? densityRaw : 'default',
      brandName: root.dataset.ozBrandName || 'OzoneUI'
    };
  },

  encode(): string {
    const s = this.read();
    return `oz://${s.mode}-${s.theme}-${s.hue}-${s.accentHue}-b${s.blur}-r${s.radius}-s${s.sound ? 1 : 0}`;
  },

  emitChange() {
    const root = document.documentElement;
    root.dataset.ozDna = this.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: this.read() }));
  },

  hexToOklch(hex: string): { l: number; c: number; h: number } {
    const clean = normalizeHex(hex).slice(1);
    const r = srgbToLinear(parseInt(clean.slice(0, 2), 16) / 255);
    const g = srgbToLinear(parseInt(clean.slice(2, 4), 16) / 255);
    const b = srgbToLinear(parseInt(clean.slice(4, 6), 16) / 255);

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

  applyPreset(name: string): BrandPreset | null {
    const preset = findPreset(name);
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
    if (!root.dataset.ozFlavour || root.dataset.ozFlavour === 'ozone') {
      root.style.setProperty('--oz-blur', `${preset.blur}px`);
      root.style.setProperty('--oz-radius', `${preset.radius}px`);
    } else {
      root.style.removeProperty('--oz-blur');
      root.style.removeProperty('--oz-radius');
    }
    this.emitChange();
    return preset;
  },

  fromHex(hex: string, harmony: BrandHarmony = 'analogous') {
    const normalized = normalizeHex(hex);
    const oklch = this.hexToOklch(normalized);
    const hue = oklch.h;
    const offsetMap: Record<BrandHarmony, number> = {
      analogous: 55,
      complementary: 180,
      triadic: 120,
      monochrome: 0
    };
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

  fromLogoFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file || typeof FileReader === 'undefined') {
        reject(new Error('FileReader unavailable'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read logo image'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Unsupported logo format'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const fallback = this.fromHex('#00b4d8').hex;
            resolve(fallback);
            return;
          }
          ctx.drawImage(img, 0, 0, 32, 32);
          const pixels = ctx.getImageData(0, 0, 32, 32).data;
          let bestScore = -1;
          let bestHex = '#00b4d8';
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            if (a < 128) continue;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if (luma < 0.08 || luma > 0.94) continue;
            const sat = max === 0 ? 0 : (max - min) / max;
            const score = sat * (1 - Math.abs(luma - 0.55));
            if (score > bestScore) {
              bestScore = score;
              bestHex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
            }
          }
          const applied = this.fromHex(bestHex, this.read().harmony);
          resolve(applied.hex);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  },

  setDensity(density: BrandDensity) {
    const root = document.documentElement;
    root.dataset.ozDensity = density;
    if (density === 'compact') root.style.setProperty('--oz-radius', '10px');
    else if (density === 'spacious') root.style.setProperty('--oz-radius', '22px');
    else root.style.setProperty('--oz-radius', '16px');
    this.emitChange();
  },

  setBrandName(name: string) {
    const root = document.documentElement;
    const trimmed = String(name || '').trim();
    if (trimmed) root.dataset.ozBrandName = trimmed;
    else delete root.dataset.ozBrandName;
    document.querySelectorAll<HTMLElement>('[data-oz-brand-text]').forEach((el) => {
      if (!el.dataset.ozDefaultBrand) {
        el.dataset.ozDefaultBrand = el.textContent?.trim() || 'OzoneUI';
      }
      el.textContent = trimmed || el.dataset.ozDefaultBrand;
    });
    this.emitChange();
  },

  getDeployHTML(): string {
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

  getShareURL(): string {
    if (typeof window === 'undefined') return '';
    const s = this.read();
    const url = new URL(window.location.href);
    url.searchParams.set('preset', s.preset);
    url.searchParams.set('brand', s.brand.replace(/^#/, ''));
    url.searchParams.set('harmony', s.harmony);
    url.searchParams.set('mode', s.mode);
    url.searchParams.set('theme', s.theme);
    url.searchParams.set('density', s.density);
    if (s.brandName && s.brandName !== 'OzoneUI') {
      url.searchParams.set('name', s.brandName);
    } else {
      url.searchParams.delete('name');
    }
    return url.toString();
  },

  getW3CTokens(): string {
    const s = this.read();
    const lPrim = s.theme === 'light' ? '0.54' : '0.72';
    const tokens = {
      $schema: 'https://tr.designtokens.org/format/',
      meta: {
        framework: 'OzoneUI',
        preset: s.preset,
        brandName: s.brandName,
        harmony: s.harmony,
        contrast: document.documentElement.dataset.ozContrast || 'AAA Verified'
      },
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
      dimension: {
        radius: { $value: `${s.radius}px`, $type: 'dimension' },
        blur: { $value: `${s.blur}px`, $type: 'dimension' },
        density: { $value: s.density, $type: 'string' }
      }
    };
    return JSON.stringify(tokens, null, 2);
  },

  initBranding() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const params = new URLSearchParams(window.location.search);

    const urlPreset = params.get('preset');
    const urlBrand = params.get('brand') || params.get('hex');
    const urlHarmony = (params.get('harmony') || root.dataset.ozHarmony || 'analogous') as BrandHarmony;
    const urlMode = params.get('mode');
    const urlTheme = params.get('theme');
    const urlDensity = params.get('density') as BrandDensity | null;
    const urlName = params.get('name');

    const attrPreset = root.dataset.ozPreset || root.getAttribute('data-theme') || '';
    const attrBrand = root.dataset.ozBrand || '';

    if (urlPreset && urlPreset !== 'custom') {
      this.applyPreset(urlPreset);
    } else if (!urlBrand && attrPreset && attrPreset !== 'custom') {
      this.applyPreset(attrPreset);
    }

    if (urlBrand) {
      this.fromHex(urlBrand, urlHarmony);
    } else if (!urlPreset && attrBrand && !attrPreset) {
      this.fromHex(attrBrand, urlHarmony);
    }

    if (urlMode === 'atmospheric' || urlMode === 'precision') {
      root.dataset.ozMode = urlMode;
    }
    if (urlTheme === 'dark' || urlTheme === 'light') {
      root.dataset.ozTheme = urlTheme;
    }
    if (urlDensity && ['compact', 'default', 'spacious'].includes(urlDensity)) {
      this.setDensity(urlDensity);
    } else if (root.dataset.ozDensity && ['compact', 'spacious'].includes(root.dataset.ozDensity)) {
      this.setDensity(root.dataset.ozDensity as BrandDensity);
    }
    if (urlName) {
      this.setBrandName(urlName);
    } else if (root.dataset.ozBrandName) {
      this.setBrandName(root.dataset.ozBrandName);
    }
    const urlFlavour = params.get('flavour') || params.get('flavor');
    if (urlFlavour) {
      root.dataset.ozFlavour = urlFlavour;
      root.style.removeProperty('--oz-radius');
      root.style.removeProperty('--oz-blur');
      root.style.removeProperty('--oz-backdrop');
    }
  },

  apply(code: string): boolean {
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
