// ============================================================================
// OzoneUI Pack C: High-End Landing Pages & Showcases
// <oz-hero>, <oz-bento>, <oz-pricing>, <oz-marquee>
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';

// 14. <oz-hero>
export class OzHero extends OzoneElement {
  static get observedAttributes() {
    return ['badge', 'title', 'subtitle'];
  }

  private badgeEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private subEl: HTMLElement | null = null;

  protected render() {
    const nodes = this.captureSlotNodes();
    const badge = this.prop('badge');
    const title = this.prop('title', ['heading'], 'Build the Future Interface');
    const subtitle = this.prop('subtitle', ['description']);

    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `
        <div class="oz-hero__badge"></div>
        <h1 class="oz-hero__title"></h1>
        <p class="oz-hero__subtitle"></p>
        <div class="oz-hero__actions"></div>
      `;
      this.badgeEl = this.querySelector('.oz-hero__badge');
      this.titleEl = this.querySelector('.oz-hero__title');
      this.subEl = this.querySelector('.oz-hero__subtitle');
      const actions = this.querySelector('.oz-hero__actions')!;
      nodes.forEach((n) => actions.appendChild(n));
    }

    if (this.badgeEl) {
      this.badgeEl.innerHTML = badge ? `<oz-badge variant="cyan" pulse>${escapeHTML(badge)}</oz-badge>` : '';
    }
    if (this.titleEl) this.titleEl.textContent = title;
    if (this.subEl) {
      this.subEl.textContent = subtitle;
      this.subEl.style.display = subtitle ? 'block' : 'none';
    }
  }
}

// 15. <oz-bento> (Responsive Sortable Drag-and-Drop Grid)
export class OzBento extends OzoneElement {
  static get observedAttributes() {
    return ['cols', 'gap', 'sortable', 'persist-key'];
  }

  private dragSrc: HTMLElement | null = null;

  protected render() {
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

  private wireSortableChildren() {
    const items = Array.from(this.children) as HTMLElement[];
    items.forEach((item, idx) => {
      if (!item.dataset.ozSortId) {
        item.dataset.ozSortId = item.id || `bento-${idx}`;
      }
      if (item.dataset.ozSortableBound) return;
      item.dataset.ozSortableBound = 'true';
      item.draggable = true;

      item.addEventListener('dragstart', (e) => {
        this.dragSrc = item;
        item.classList.add('oz-drag-ghost');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.dataset.ozSortId || '');
        }
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.dragSrc && this.dragSrc !== item) {
          item.classList.add('oz-drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('oz-drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('oz-drag-over');
        if (!this.dragSrc || this.dragSrc === item) return;

        const src = this.dragSrc;
        sound.click();
        morph(() => {
          const all = Array.from(this.children);
          const srcIdx = all.indexOf(src);
          const dstIdx = all.indexOf(item);
          if (srcIdx < dstIdx) {
            item.after(src);
          } else {
            item.before(src);
          }
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

  private saveOrder() {
    const key = this.getAttribute('persist-key');
    if (!key) return;
    const order = Array.from(this.children).map((el) => (el as HTMLElement).dataset.ozSortId).filter(Boolean);
    try {
      localStorage.setItem(`oz-bento:${key}`, JSON.stringify(order));
    } catch {}
  }

  private restoreOrder() {
    const key = this.getAttribute('persist-key');
    const children = Array.from(this.children) as HTMLElement[];
    children.forEach((el, idx) => {
      if (!el.dataset.ozSortId) el.dataset.ozSortId = el.id || `bento-${idx}`;
    });
    if (!key) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`oz-bento:${key}`) || 'null');
      if (Array.isArray(saved)) {
        const byId = new Map(children.map((c) => [c.dataset.ozSortId, c]));
        saved.forEach((id) => {
          const node = byId.get(id);
          if (node) this.appendChild(node);
        });
      }
    } catch {}
  }
}

// 16. <oz-pricing>
export class OzPricing extends OzoneElement {
  static get observedAttributes() {
    return ['title', 'price', 'period', 'popular', 'features', 'cta', 'subtitle'];
  }

  protected render() {
    const title = this.prop('title', ['name'], 'Pro');
    const subtitle = this.prop('subtitle');
    const price = this.prop('price', [], '$49');
    const period = this.prop('period', [], '/mo');
    const popular = this.boolProp('popular');
    const cta = this.prop('cta', [], 'Deploy Now');
    const features = this.prop('features', [], '').split(',').map((s) => s.trim()).filter(Boolean);

    this.innerHTML = `
      <div>
        <div class="oz-between">
          <div class="oz-card__title">${escapeHTML(title)}</div>
          ${popular ? `<oz-badge variant="cyan" pulse>Most Popular</oz-badge>` : ''}
        </div>
        ${subtitle ? `<div class="oz-card__subtitle">${escapeHTML(subtitle)}</div>` : ''}
        <div class="oz-pricing__price">
          ${escapeHTML(price)}<span class="oz-muted" style="font-size:0.95rem;font-weight:500;">${escapeHTML(period)}</span>
        </div>
        <ul class="oz-pricing__features">
          ${features.map((f) => `<li><oz-icon name="check" size="15" style="color:var(--oz-emerald);"></oz-icon><span>${escapeHTML(f)}</span></li>`).join('')}
        </ul>
      </div>
      <oz-button variant="${popular ? 'glow' : 'glass'}" class="oz-w-full" style="width:100%;display:block;">${escapeHTML(cta)}</oz-button>
    `;

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

// 17. <oz-marquee>
export class OzMarquee extends OzoneElement {
  static get observedAttributes() {
    return ['speed'];
  }

  protected render() {
    const speed = this.prop('speed', [], '28s');
    this.style.setProperty('--oz-marquee-speed', speed);

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
