// ============================================================================
// OzoneUI Spatial OS Layer: <oz-command> (Cmd+K) & <oz-inspector> (Alt+O)
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { dna, type BrandDensity, type BrandHarmony } from '../core/dna.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { agent } from '../core/agent.ts';
import { icons } from './icon.ts';
import { setMode, setTheme, setPrivacyMode, setSound, getAIPrompt } from '../core/registry.ts';

interface CommandEntry {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

// 22. <oz-command> (Cmd+K Auto-Discovering OS Palette)
export class OzCommand extends OzoneElement {
  static get observedAttributes() {
    return ['auto-discover'];
  }

  private isOpen = false;
  private query = '';
  private selectedIdx = 0;
  private boundKey = false;

  public open() {
    this.isOpen = true;
    sound.open();
    this.safeRender();
    requestAnimationFrame(() => {
      (this.querySelector('.oz-cmd-input') as HTMLInputElement | null)?.focus();
    });
  }

  public close() {
    this.isOpen = false;
    this.query = '';
    this.selectedIdx = 0;
    this.safeRender();
  }

  public toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  private gatherCommands(): CommandEntry[] {
    const entries: CommandEntry[] = [
      {
        id: 'mode-toggle',
        label: 'Toggle Aesthetic Mode (Atmospheric ↔ Precision)',
        group: 'Theme DNA',
        hint: 'Mode',
        run: () => {
          const next = document.documentElement.dataset.ozMode === 'precision' ? 'atmospheric' : 'precision';
          setMode(next);
          toast({ title: 'Mode Switched', message: `Active mode: ${next}`, variant: 'cyan' });
        }
      },
      {
        id: 'theme-toggle',
        label: 'Toggle Color Theme (Dark ↔ Light)',
        group: 'Theme DNA',
        hint: 'Theme',
        run: () => {
          const next = document.documentElement.dataset.ozTheme === 'light' ? 'dark' : 'light';
          setTheme(next);
          toast({ title: 'Theme Switched', message: `Active theme: ${next}`, variant: 'violet' });
        }
      },
      {
        id: 'privacy-toggle',
        label: 'Toggle Streamer / PII Privacy Veil',
        group: 'Security',
        hint: 'Privacy',
        run: () => {
          const next = document.documentElement.dataset.ozPrivacy !== 'true';
          setPrivacyMode(next);
          toast({ title: 'Privacy Veil', message: next ? 'Sensitive fields masked.' : 'Sensitive fields revealed.', variant: 'amber' });
        }
      },
      {
        id: 'sound-toggle',
        label: 'Toggle Procedural Web Audio Micro-FX',
        group: 'Audio',
        hint: 'Audio',
        run: () => {
          const next = document.documentElement.dataset.ozSound === 'off';
          setSound(next);
          toast({ title: 'Audio FX', message: next ? 'Synthesizer enabled.' : 'Synthesizer muted.', variant: 'cyan' });
        }
      },
      {
        id: 'ai-copilot',
        label: 'Launch AI Ghost Cursor Co-Pilot Tour',
        group: 'AI Agent',
        hint: 'Agent',
        run: () => agent.runDemoWorkflow()
      },
      {
        id: 'open-inspector',
        label: 'Open Live Theme DNA Studio',
        group: 'Theme DNA',
        hint: 'Alt+O',
        run: () => {
          const insp = document.querySelector('oz-inspector') as OzInspector | null;
          insp?.open();
        }
      },
      {
        id: 'copy-ai-prompt',
        label: 'Copy OzoneUI AI System Prompt (llms.txt)',
        group: 'AI Agent',
        hint: 'Copy',
        run: () => {
          navigator.clipboard?.writeText(getAIPrompt()).catch(() => {});
          toast({ title: 'AI Prompt Copied', message: 'Ready to paste into any LLM system prompt.', variant: 'emerald' });
        }
      },
      {
        id: 'copy-share-url',
        label: 'Copy Client Share Link (?preset / ?brand URL)',
        group: 'Client Branding',
        hint: 'URL',
        run: () => {
          const url = dna.getShareURL();
          navigator.clipboard?.writeText(url).catch(() => {});
          toast({ title: 'Client Pitch Link Copied', message: 'Opens this exact brand palette and white-label identity.', variant: 'emerald' });
        }
      },
      ...(['emerald', 'amethyst', 'crimson', 'amber', 'ocean', 'nordic', 'daylight', 'ozone'] as const).map((presetKey) => {
        const p = dna.presets[presetKey];
        return {
          id: `preset-${p.id}`,
          label: `Apply Brand Preset: ${p.label}`,
          group: 'Brand Presets',
          hint: p.mode === 'precision' ? 'Precision' : p.theme,
          run: () => {
            dna.applyPreset(p.id);
            toast({ title: 'Brand Preset Applied', message: `${p.label} (${p.hue}° / ${p.hex})`, variant: 'cyan' });
          }
        };
      })
    ];

    if (this.boolProp('auto-discover') || !this.hasAttribute('manual')) {
      document.querySelectorAll('[data-oz-cmd]').forEach((el, i) => {
        const label = el.getAttribute('data-oz-cmd') || el.textContent?.trim() || `Command ${i + 1}`;
        entries.push({
          id: `disc-${i}`,
          label,
          group: 'Page Navigation',
          hint: 'Jump',
          run: () => (el as HTMLElement).click()
        });
      });
    }

    return entries;
  }

  protected render() {
    if (!this.boundKey) {
      this.boundKey = true;
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.toggle();
        } else if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    const all = this.gatherCommands();
    const q = this.query.trim().toLowerCase();
    const filtered = all.filter((c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    if (this.selectedIdx >= filtered.length) this.selectedIdx = Math.max(0, filtered.length - 1);

    this.innerHTML = `
      <div class="oz-cmd-overlay" data-open="${this.isOpen}">
        <div class="oz-cmd-box" role="dialog" aria-label="OzoneOS Command Palette">
          <div class="oz-cmd-input-row">
            <oz-icon name="command" size="18" style="color:var(--oz-primary);"></oz-icon>
            <input class="oz-cmd-input" placeholder="Search commands, domains, AI actions, or Theme DNA..." value="${escapeHTML(this.query)}" />
            <kbd>ESC</kbd>
          </div>
          <div class="oz-cmd-list">
            ${filtered.length === 0 ? `<div class="oz-muted oz-text-sm" style="padding:16px;text-align:center;">No matching commands</div>` : filtered.map((cmd, idx) => `
              <div class="oz-cmd-item" data-cmd-idx="${idx}" data-selected="${idx === this.selectedIdx}">
                <div>
                  <div style="font-weight:600;">${escapeHTML(cmd.label)}</div>
                  <div class="oz-text-xs oz-muted">${escapeHTML(cmd.group)}</div>
                </div>
                ${cmd.hint ? `<kbd>${escapeHTML(cmd.hint)}</kbd>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const overlay = this.querySelector('.oz-cmd-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const input = this.querySelector('.oz-cmd-input') as HTMLInputElement | null;
    if (input && this.isOpen) {
      input.addEventListener('input', () => {
        const pos = input.selectionStart || 0;
        this.query = input.value;
        this.selectedIdx = 0;
        this.safeRender();
        const nextInp = this.querySelector('.oz-cmd-input') as HTMLInputElement | null;
        if (nextInp) {
          nextInp.focus();
          nextInp.setSelectionRange(pos, pos);
        }
      });

      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIdx = Math.min(filtered.length - 1, this.selectedIdx + 1);
          this.updateHighlightOnly();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIdx = Math.max(0, this.selectedIdx - 1);
          this.updateHighlightOnly();
        } else if (e.key === 'Enter' && filtered[this.selectedIdx]) {
          e.preventDefault();
          const chosen = filtered[this.selectedIdx];
          this.close();
          chosen.run();
        }
      });
    }

    this.querySelectorAll('[data-cmd-idx]').forEach((row) => {
      row.addEventListener('click', () => {
        const i = Number((row as HTMLElement).dataset.cmdIdx);
        const chosen = filtered[i];
        if (chosen) {
          this.close();
          chosen.run();
        }
      });
    });
  }

  private updateHighlightOnly() {
    this.querySelectorAll('[data-cmd-idx]').forEach((row, idx) => {
      (row as HTMLElement).dataset.selected = idx === this.selectedIdx ? 'true' : 'false';
      if (idx === this.selectedIdx) row.scrollIntoView({ block: 'nearest' });
    });
  }
}

// 23. <oz-inspector> (Alt+O Floating Theme DNA Studio)
export class OzInspector extends OzoneElement {
  static get observedAttributes() {
    return ['open'];
  }

  private boundKey = false;
  private mountedPanel = false;

  public open() {
    this.setAttribute('open', '');
    sound.open();
  }

  public close() {
    this.removeAttribute('open');
    sound.click();
  }

  public toggle() {
    if (this.boolProp('open')) this.close();
    else this.open();
  }

  private syncUI() {
    const panel = this.querySelector('.oz-inspector-panel') as HTMLElement | null;
    if (!panel) return;
    const isOpen = this.boolProp('open');
    panel.dataset.open = String(isOpen);
    const state = dna.read();
    const iconSet = icons.getDefaultSet();
    const contrastLabel = document.documentElement.dataset.ozContrast || 'AAA Verified';

    const contrastEl = this.querySelector('[data-insp-contrast]');
    if (contrastEl) contrastEl.setAttribute('label', contrastLabel);

    this.querySelectorAll<HTMLElement>('[data-insp-preset]').forEach((b) => {
      b.dataset.active = String(b.dataset.inspPreset === state.preset);
    });

    const hexInput = this.querySelector('[data-insp-hex]') as HTMLInputElement | null;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = state.brand;
    const hexLabel = this.querySelector('[data-insp-hex-label]');
    if (hexLabel) hexLabel.textContent = state.brand;

    this.querySelectorAll<HTMLElement>('[data-insp-harmony]').forEach((b) => {
      b.className = `oz-btn oz-btn--sm ${b.dataset.inspHarmony === state.harmony ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });

    const syncSlider = (key: string, val: number, suffix: string) => {
      const inp = this.querySelector(`[data-range="${key}"]`) as HTMLInputElement | null;
      if (inp && document.activeElement !== inp) inp.value = String(val);
      const lbl = this.querySelector(`[data-val-${key}]`);
      if (lbl) lbl.textContent = `${val}${suffix}`;
    };
    syncSlider('hue', state.hue, '°');
    syncSlider('accent', state.accentHue, '°');
    syncSlider('blur', state.blur, 'px');
    syncSlider('radius', state.radius, 'px');

    const nameInput = this.querySelector('[data-insp-brand-name]') as HTMLInputElement | null;
    const targetName = state.brandName === 'OzoneUI' ? '' : state.brandName;
    if (nameInput && document.activeElement !== nameInput) nameInput.value = targetName;

    this.querySelectorAll<HTMLElement>('[data-insp-density]').forEach((b) => {
      b.className = `oz-btn oz-btn--sm ${b.dataset.inspDensity === state.density ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });
    this.querySelectorAll<HTMLElement>('[data-set-mode]').forEach((b) => {
      b.className = `oz-btn oz-btn--sm ${b.dataset.setMode === state.mode ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });
    this.querySelectorAll<HTMLElement>('[data-set-theme]').forEach((b) => {
      b.className = `oz-btn oz-btn--sm ${b.dataset.setTheme === state.theme ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });
    this.querySelectorAll<HTMLElement>('[data-set-icons]').forEach((b) => {
      b.className = `oz-btn oz-btn--sm ${b.dataset.setIcons === iconSet ? 'oz-btn--primary' : 'oz-btn--glass'}`;
    });

    const dnaEl = this.querySelector('[data-dna-code]');
    if (dnaEl) dnaEl.textContent = dna.encode();
  }

  protected render() {
    if (!this.boundKey) {
      this.boundKey = true;
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          this.toggle();
        }
      });
      window.addEventListener('oz-dna-change', () => this.syncUI());
      window.addEventListener('oz-icon-set-change', () => this.syncUI());
    }

    if (this.mountedPanel && this.querySelector('.oz-inspector-panel')) {
      this.syncUI();
      return;
    }
    this.mountedPanel = true;

    const isOpen = this.boolProp('open');
    const state = dna.read();
    const barcode = dna.encode();
    const iconSet = icons.getDefaultSet();
    const presetList = Object.values(dna.presets);
    const contrastLabel = document.documentElement.dataset.ozContrast || 'AAA Verified';

    this.innerHTML = `
      <aside class="oz-inspector-panel" data-open="${isOpen}" style="padding:14px 16px;gap:10px;" aria-label="OzoneUI Live Theme DNA Studio">
        <div class="oz-between">
          <div>
            <div style="font-weight:600;font-size:0.95rem;">Theme DNA Studio</div>
            <div class="oz-text-xs oz-muted">Live OKLCH &amp; Client Brand <kbd>Alt+O</kbd></div>
          </div>
          <button type="button" class="oz-btn oz-btn--ghost oz-btn--sm" data-insp-close aria-label="Close"><oz-icon name="x" size="16"></oz-icon></button>
        </div>

        <div class="oz-stack" style="gap:6px;">
          <div class="oz-between">
            <span class="oz-text-xs oz-muted">8 Brand Presets</span>
            <oz-badge variant="emerald" data-insp-contrast>${escapeHTML(contrastLabel)}</oz-badge>
          </div>
          <div class="oz-between" style="gap:8px;">
            <div class="oz-swatch-row">
              ${presetList.map((p) => `
                <button type="button" class="oz-swatch-btn" data-insp-preset="${escapeHTML(p.id)}" data-active="${state.preset === p.id}" title="${escapeHTML(p.label)}" aria-label="Apply ${escapeHTML(p.label)}" style="background:${escapeHTML(p.swatch)};"></button>
              `).join('')}
            </div>
            <label class="oz-row oz-text-xs" style="gap:5px;cursor:pointer;" title="Custom Brand HEX">
              <input type="color" class="oz-color-input" data-insp-hex value="${escapeHTML(state.brand)}" aria-label="Pick brand HEX color" />
              <code data-insp-hex-label style="color:var(--oz-primary);font-weight:600;">${escapeHTML(state.brand)}</code>
            </label>
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
            <div class="oz-row" style="gap:4px;">
              ${(['analogous', 'complementary', 'triadic', 'monochrome'] as const).map((h) => `
                <button type="button" class="oz-btn oz-btn--sm ${state.harmony === h ? 'oz-btn--primary' : 'oz-btn--glass'}" data-insp-harmony="${h}" style="padding:3px 7px;font-size:0.68rem;text-transform:capitalize;">${h === 'complementary' ? 'Complement' : h === 'monochrome' ? 'Mono' : h}</button>
              `).join('')}
            </div>
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
            ${(['compact', 'default', 'spacious'] as const).map((d) => `
              <button type="button" class="oz-btn oz-btn--sm ${state.density === d ? 'oz-btn--primary' : 'oz-btn--glass'}" data-insp-density="${d}" style="padding:4px 6px;font-size:0.68rem;text-transform:capitalize;">${d === 'default' ? 'Std' : d === 'compact' ? 'Tight' : 'Airy'}</button>
            `).join('')}
          </div>

          <div class="oz-row" style="gap:4px;">
            ${(['builtin', 'ph', 'tabler', 'solar', 'heroicons'] as const).map((s) => `
              <button type="button" class="oz-btn oz-btn--sm ${iconSet === s ? 'oz-btn--primary' : 'oz-btn--glass'}" data-set-icons="${s}" style="padding:3px 6px;font-size:0.68rem;">${s === 'builtin' ? 'Built-in' : s === 'ph' ? 'Phosphor' : s}</button>
            `).join('')}
          </div>
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
      </aside>
    `;

    this.querySelector('[data-insp-close]')?.addEventListener('click', () => this.close());

    this.querySelectorAll('[data-insp-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = (b as HTMLElement).dataset.inspPreset || 'ozone';
        sound.click();
        const applied = dna.applyPreset(id);
        if (applied) toast({ title: 'Brand Preset Applied', message: `${applied.label} palette active.`, variant: 'cyan', duration: 1800 });
      });
    });

    this.querySelector('[data-insp-hex]')?.addEventListener('input', (e) => {
      dna.fromHex((e.target as HTMLInputElement).value, dna.read().harmony);
    });

    this.querySelectorAll('[data-insp-harmony]').forEach((b) => {
      b.addEventListener('click', () => {
        sound.click();
        dna.fromHex(dna.read().brand, (b as HTMLElement).dataset.inspHarmony as BrandHarmony);
      });
    });

    const logoInput = this.querySelector('[data-insp-logo-file]') as HTMLInputElement | null;
    this.querySelector('[data-insp-logo]')?.addEventListener('click', () => logoInput?.click());
    logoInput?.addEventListener('change', async () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      try {
        const hex = await dna.fromLogoFile(file);
        sound.success();
        toast({ title: 'Logo Brand Extracted', message: `Applied dominant OKLCH color ${hex}.`, variant: 'emerald' });
      } catch {
        toast({ title: 'Logo Read Failed', message: 'Please choose a valid PNG, JPG, or SVG file.', variant: 'rose' });
      }
    });

    this.querySelector('[data-insp-brand-name]')?.addEventListener('input', (e) => {
      dna.setBrandName((e.target as HTMLInputElement).value);
    });

    this.querySelectorAll('[data-insp-density]').forEach((b) => {
      b.addEventListener('click', () => {
        sound.click();
        dna.setDensity((b as HTMLElement).dataset.inspDensity as BrandDensity);
      });
    });

    this.querySelectorAll('[data-set-mode]').forEach((b) => {
      b.addEventListener('click', () => {
        sound.click();
        document.documentElement.style.removeProperty('--oz-backdrop');
        setMode((b as HTMLElement).dataset.setMode as 'atmospheric' | 'precision');
      });
    });

    this.querySelectorAll('[data-set-theme]').forEach((b) => {
      b.addEventListener('click', () => {
        sound.click();
        setTheme((b as HTMLElement).dataset.setTheme as 'dark' | 'light');
      });
    });

    this.querySelectorAll('[data-set-icons]').forEach((b) => {
      b.addEventListener('click', () => {
        const nextSet = (b as HTMLElement).dataset.setIcons || 'builtin';
        sound.click();
        icons.setDefaultSet(nextSet);
        toast({ title: 'Icon Pack Switched', message: `Active <oz-icon> set: ${nextSet}`, variant: 'cyan', duration: 2000 });
      });
    });

    this.querySelector('[data-range="hue"]')?.addEventListener('input', (e) => {
      const v = (e.target as HTMLInputElement).value;
      document.documentElement.style.setProperty('--oz-hue', v);
      document.documentElement.dataset.ozPreset = 'custom';
      const lbl = this.querySelector('[data-val-hue]');
      if (lbl) lbl.textContent = `${v}°`;
      dna.emitChange();
    });

    this.querySelector('[data-range="accent"]')?.addEventListener('input', (e) => {
      const v = (e.target as HTMLInputElement).value;
      document.documentElement.style.setProperty('--oz-accent-hue', v);
      document.documentElement.dataset.ozPreset = 'custom';
      const lbl = this.querySelector('[data-val-accent]');
      if (lbl) lbl.textContent = `${v}°`;
      dna.emitChange();
    });

    this.querySelector('[data-range="blur"]')?.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value) || 0;
      document.documentElement.style.setProperty('--oz-blur', `${v}px`);
      document.documentElement.style.setProperty('--oz-backdrop', v > 0 ? `blur(${v}px) saturate(175%)` : 'none');
      const lbl = this.querySelector('[data-val-blur]');
      if (lbl) lbl.textContent = `${v}px`;
      dna.emitChange();
    });

    this.querySelector('[data-range="radius"]')?.addEventListener('input', (e) => {
      const v = (e.target as HTMLInputElement).value;
      document.documentElement.style.setProperty('--oz-radius', `${v}px`);
      const lbl = this.querySelector('[data-val-radius]');
      if (lbl) lbl.textContent = `${v}px`;
      dna.emitChange();
    });

    this.querySelector('[data-copy-html-tag]')?.addEventListener('click', () => {
      const snippet = dna.getDeployHTML();
      navigator.clipboard?.writeText(snippet).catch(() => {});
      sound.success();
      toast({ title: '<html> Tag Copied', message: snippet, variant: 'emerald' });
    });

    this.querySelector('[data-copy-share-url]')?.addEventListener('click', () => {
      const url = dna.getShareURL();
      navigator.clipboard?.writeText(url).catch(() => {});
      sound.success();
      toast({ title: 'Client Pitch Link Copied', message: 'Shareable ?preset / ?brand URL copied!', variant: 'emerald' });
    });

    this.querySelector('[data-copy-w3c]')?.addEventListener('click', () => {
      const json = dna.getW3CTokens();
      navigator.clipboard?.writeText(json).catch(() => {});
      sound.success();
      toast({ title: 'W3C Tokens Copied', message: 'Design Tokens JSON copied to clipboard.', variant: 'violet' });
    });

    this.querySelector('[data-copy-dna]')?.addEventListener('click', () => {
      const code = dna.encode();
      navigator.clipboard?.writeText(code).catch(() => {});
      sound.success();
      toast({ title: 'Theme DNA Copied', message: code, variant: 'emerald' });
    });

    this.querySelector('[data-reset-dna]')?.addEventListener('click', () => {
      sound.click();
      dna.reset();
      toast({ title: 'Theme Reset', message: 'Restored default OzoneUI Atmospheric DNA.', variant: 'cyan' });
    });
  }
}
