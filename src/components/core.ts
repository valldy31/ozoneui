// ============================================================================
// OzoneUI Pack A: Core Foundation Primitives
// <oz-button>, <oz-card>, <oz-badge>, <oz-input>, <oz-switch>, <oz-tabs>, <oz-dialog>, <oz-avatar>
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';

// 1. <oz-button>
export class OzButton extends OzoneElement {
  static get observedAttributes() {
    return ['variant', 'type', 'color', 'theme', 'kind', 'size', 'loading', 'disabled', 'label', 'text', 'pill', 'toast', 'icon', 'icon-right'];
  }

  private btnEl: HTMLButtonElement | null = null;
  private iconLeftEl: HTMLElement | null = null;
  private iconRightEl: HTMLElement | null = null;

  protected render() {
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
        if (!btn.textContent?.trim() && explicitLabel) {
          btn.textContent = explicitLabel;
        }
      }
      btn.addEventListener('click', (e) => {
        if (this.boolProp('disabled') || this.boolProp('loading')) {
          e.stopImmediatePropagation();
          return;
        }
        sound.click();
        const toastMsg = this.getAttribute('toast');
        if (toastMsg) {
          toast({ title: 'Action Triggered', message: toastMsg, variant: 'cyan' });
        }
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
        if (!this.iconLeftEl) {
          this.iconLeftEl = document.createElement('oz-icon');
          this.btnEl.prepend(this.iconLeftEl);
        }
        this.iconLeftEl.setAttribute('name', iconLeft);
        this.iconLeftEl.setAttribute('size', iconPx);
      } else if (this.iconLeftEl) {
        this.iconLeftEl.remove();
        this.iconLeftEl = null;
      }

      if (iconRight) {
        if (!this.iconRightEl) {
          this.iconRightEl = document.createElement('oz-icon');
          this.btnEl.appendChild(this.iconRightEl);
        }
        this.iconRightEl.setAttribute('name', iconRight);
        this.iconRightEl.setAttribute('size', iconPx);
      } else if (this.iconRightEl) {
        this.iconRightEl.remove();
        this.iconRightEl = null;
      }

      const existingSpinner = this.btnEl.querySelector('.oz-spinner');
      if (isLoading && !existingSpinner) {
        const sp = document.createElement('span');
        sp.className = 'oz-spinner';
        this.btnEl.prepend(sp);
      } else if (!isLoading && existingSpinner) {
        existingSpinner.remove();
      }
    }
  }

  private resolveVariant(): string {
    const v = this.prop('variant', ['type', 'color', 'theme', 'kind'], '');
    if (v) return v;
    for (const shorthand of ['glow', 'primary', 'glass', 'ghost', 'danger', 'success']) {
      if (this.hasAttribute(shorthand)) return shorthand;
    }
    return 'glass';
  }
}

// 2. <oz-card>
export class OzCard extends OzoneElement {
  static get observedAttributes() {
    return ['title', 'subtitle', 'badge', 'exportable', 'glow'];
  }

  private headerEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;

  protected render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = '';
      this.headerEl = document.createElement('div');
      this.headerEl.className = 'oz-card__header';
      this.bodyEl = document.createElement('div');
      this.bodyEl.className = 'oz-card__body';
      nodes.forEach((n) => this.bodyEl!.appendChild(n));
      this.appendChild(this.headerEl);
      this.appendChild(this.bodyEl);
    }

    const title = this.prop('title', ['heading']);
    const subtitle = this.prop('subtitle', ['description', 'desc']);
    const badge = this.prop('badge');
    const exportable = this.boolProp('exportable');

    if (this.headerEl) {
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
            ${exportable ? `<button class="oz-btn oz-btn--ghost oz-btn--sm" data-oz-export-card title="Copy Card Snapshot">Export</button>` : ''}
          </div>
        `;
        this.headerEl.querySelector('[data-oz-export-card]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.success();
          const summary = {
            title: title || 'OzoneCard',
            subtitle,
            text: this.bodyEl?.textContent?.trim() || ''
          };
          navigator.clipboard?.writeText(JSON.stringify(summary, null, 2)).catch(() => {});
          toast({ title: 'Card Exported', message: 'Card snapshot copied to clipboard.', variant: 'emerald' });
        });
      }
    }
  }
}

// 3. <oz-badge>
export class OzBadge extends OzoneElement {
  static get observedAttributes() {
    return ['variant', 'color', 'type', 'pulse', 'label', 'text', 'icon'];
  }

  protected render() {
    const nodes = this.captureSlotNodes();
    const variant = this.prop('variant', ['color', 'type', 'theme'], 'neutral');
    const pulse = this.boolProp('pulse', ['live']);
    const icon = this.prop('icon');
    const labelAttr = this.prop('label', ['text']);
    const text = labelAttr || nodes.map((n) => n.textContent).join('').trim();

    this.innerHTML = `
      <span class="oz-badge oz-badge--${escapeHTML(variant)}">
        ${pulse ? '<span class="oz-badge__dot oz-badge__dot--pulse"></span>' : ''}
        ${icon ? `<oz-icon name="${escapeHTML(icon)}" size="12"></oz-icon>` : ''}
        <span>${escapeHTML(text)}</span>
      </span>
    `;
  }
}

// 4. <oz-input>
export class OzInput extends OzoneElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'value', 'type', 'mask', 'icon'];
  }

  private revealed = false;

  get value(): string {
    const inp = this.querySelector('input');
    return inp ? inp.value : this.getAttribute('value') || '';
  }

  set value(v: string) {
    const inp = this.querySelector('input');
    if (inp) inp.value = v;
    this.setAttribute('value', v);
  }

  protected render() {
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
      </div>
    `;

    const _err = this.prop('error'), _hint = this.prop('hint');
    if (_err || _hint) { const m = document.createElement('div'); m.className = 'oz-field__msg' + (_err ? ' oz-field__msg--error' : ''); m.style.marginTop = '6px'; m.textContent = _err || _hint; this.querySelector('.oz-input-wrap').appendChild(m); if (_err) this.querySelector('.oz-input-box').classList.add('oz-input-box--error'); }
    const input = this.querySelector('input')!;
    input.addEventListener('input', () => {
      this.dispatchEvent(new CustomEvent('oz-input', { detail: { value: input.value }, bubbles: true }));
    });
    input.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('oz-change', { detail: { value: input.value }, bubbles: true }));
    });

    this.querySelector('[data-toggle-secret]')?.addEventListener('click', () => {
      this.revealed = !this.revealed;
      sound.click();
      const val = input.value;
      this.setAttribute('value', val);
      this.render();
    });
  }
}

// 5. <oz-switch>
export class OzSwitch extends OzoneElement {
  static get observedAttributes() {
    return ['checked', 'label', 'text'];
  }

  get checked(): boolean {
    return this.boolProp('checked');
  }

  set checked(val: boolean) {
    if (val) this.setAttribute('checked', '');
    else this.removeAttribute('checked');
  }

  protected render() {
    const checked = this.boolProp('checked');
    const label = this.prop('label', ['text', 'title'], '');

    this.innerHTML = `
      <div class="oz-switch" role="switch" tabindex="0" aria-checked="${checked}" data-checked="${checked}">
        <div class="oz-switch__track"><div class="oz-switch__thumb"></div></div>
        ${label ? `<span>${escapeHTML(label)}</span>` : ''}
      </div>
    `;

    const root = this.querySelector('.oz-switch')!;
    const toggle = () => {
      const next = !this.checked;
      this.checked = next;
      sound.toggle(next);
      this.dispatchEvent(new CustomEvent('oz-change', { detail: { checked: next }, bubbles: true }));
    };

    root.addEventListener('click', toggle);
    root.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === ' ' || ke.key === 'Enter') {
        ke.preventDefault();
        toggle();
      }
    });
  }
}

// 6. <oz-tabs>
export class OzTabs extends OzoneElement {
  static get observedAttributes() {
    return ['active', 'tabs'];
  }

  private tabButtons: HTMLElement[] = [];
  private panels: HTMLElement[] = [];
  private pillEl: HTMLElement | null = null;

  protected render() {
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

      const slotTabs = nodes.filter(
        (n): n is HTMLElement => n instanceof HTMLElement && (n.getAttribute('slot') === 'tab' || n.hasAttribute('data-tab'))
      );
      const slotPanels = nodes.filter(
        (n): n is HTMLElement => n instanceof HTMLElement && (n.getAttribute('slot') === 'panel' || n.hasAttribute('data-panel'))
      );

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
        const ro = new ResizeObserver(() => {
          const cur = Math.max(0, Math.floor(this.numProp('active', [], 0)));
          const activeBtn = this.tabButtons[cur];
          if (activeBtn && this.pillEl && activeBtn.offsetWidth > 0) {
            this.pillEl.style.width = `${activeBtn.offsetWidth}px`;
            this.pillEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
          }
        });
        ro.observe(tabBar);
      }
    }

    this.applyActive(activeIdx);
  }

  public selectTab(index: number) {
    sound.click();
    this.setAttribute('active', String(index));
    this.applyActive(index);
    const label = this.tabButtons[index]?.textContent || '';
    this.dispatchEvent(new CustomEvent('oz-tab-change', { detail: { index, label }, bubbles: true }));
  }

  private applyActive(index: number) {
    this.tabButtons.forEach((btn, i) => {
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    this.panels.forEach((p, i) => {
      p.style.display = i === index ? 'block' : 'none';
    });
    requestAnimationFrame(() => {
      const activeBtn = this.tabButtons[index];
      if (activeBtn && this.pillEl) {
        this.pillEl.style.width = `${activeBtn.offsetWidth}px`;
        this.pillEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      }
    });
  }
}

// 7. <oz-dialog>
export class OzDialog extends OzoneElement {
  static get observedAttributes() {
    return ['open', 'title'];
  }

  private backdropEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;

  public show() {
    morph(() => {
      this.setAttribute('open', '');
    });
    sound.open();
  }

  public close() {
    this.removeAttribute('open');
    sound.click();
    this.dispatchEvent(new CustomEvent('oz-close', { bubbles: true }));
  }

  protected render() {
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
        </div>
      `;
      this.backdropEl = this.querySelector('.oz-dialog-backdrop');
      this.titleEl = this.querySelector('.oz-dialog-title');
      const body = this.querySelector('.oz-dialog-body')!;
      nodes.forEach((n) => body.appendChild(n));

      this.querySelector('[data-oz-close]')?.addEventListener('click', () => this.close());
      this.backdropEl?.addEventListener('click', (e) => {
        if (e.target === this.backdropEl) this.close();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.boolProp('open')) this.close();
      });
    }

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.backdropEl) this.backdropEl.dataset.open = isOpen ? 'true' : 'false';
  }
}

// 8. <oz-avatar>
export class OzAvatar extends OzoneElement {
  static get observedAttributes() {
    return ['name', 'src', 'status', 'verified', 'size'];
  }

  protected render() {
    const name = this.prop('name', ['alt', 'author'], 'OU');
    const src = this.prop('src');
    const status = this.prop('status');
    const verified = this.boolProp('verified');
    const size = this.prop('size', [], '42px');
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');

    this.innerHTML = `
      <span class="oz-avatar" style="--oz-avatar-size:${escapeHTML(size.endsWith('px') ? size : size + 'px')}">
        ${src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(name)}" />` : `<span>${escapeHTML(initials || 'OZ')}</span>`}
        ${status ? `<span class="oz-avatar__status oz-avatar__status--${escapeHTML(status)}" title="${escapeHTML(status)}"></span>` : ''}
      </span>
      ${verified ? `<oz-icon name="verified" size="14" title="Verified" style="margin-left:4px;color:var(--oz-cyan);"></oz-icon>` : ''}
    `;
  }
}
