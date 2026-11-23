// ============================================================================
// OzoneUI Pack E: Layout, Navigation, Feedback & Functional Blocks
// <oz-header>, <oz-footer>, <oz-breadcrumbs>, <oz-alert>, <oz-progress>, <oz-accordion>, <oz-timeline>
// ============================================================================
import { OzoneElement, escapeHTML, repairJSON } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';

// 25. <oz-header>
export class OzHeader extends OzoneElement {
  private overlayEl: HTMLElement | null = null;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private docClickHandler: ((e: MouseEvent) => void) | null = null;

  static get observedAttributes() {
    return ['variant', 'brand', 'badge', 'links', 'cta', 'search', 'icon', 'mobile-menu', 'menu-style', 'drawer', 'max-links'];
  }

  disconnectedCallback() {
    this.cleanupOverlay();
    this.cleanupDocClick();
    super.disconnectedCallback();
  }

  private cleanupDocClick() {
    if (this.docClickHandler) {
      document.removeEventListener('click', this.docClickHandler);
      this.docClickHandler = null;
    }
  }

  private cleanupOverlay() {
    if (this.escHandler) {
      window.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    this.overlayEl?.remove();
    this.overlayEl = null;
  }

  private resolveMobileMode(): 'slide' | 'slide-left' | 'modal' | 'dropdown' {
    const raw = this.prop('mobile-menu', ['menu-style', 'drawer', 'mobile'], 'slide').trim().toLowerCase();
    if (raw === 'modal' || raw === 'dialog') return 'modal';
    if (raw === 'dropdown' || raw === 'inline') return 'dropdown';
    if (raw === 'slide-left' || raw === 'left') return 'slide-left';
    return 'slide';
  }

  protected render() {
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
        ${links.length ? `
          <nav class="oz-header__nav" aria-label="${escapeHTML(brand)} navigation">
            ${visibleLinks.map((lnk, idx) => `
              <button type="button" class="oz-btn oz-btn--sm ${idx === 0 ? 'oz-btn--glass' : 'oz-btn--ghost'}" data-oz-header-link="${escapeHTML(lnk)}">${escapeHTML(lnk)}</button>
            `).join('')}
            ${overflowLinks.length ? `
              <div class="oz-header__more">
                <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-header-more aria-expanded="false">
                  <span>+${overflowLinks.length} More</span>
                  <oz-icon name="chevron-down" size="13"></oz-icon>
                </button>
                <div class="oz-header__more-menu" data-open="false">
                  ${overflowLinks.map((lnk) => `
                    <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-header-link="${escapeHTML(lnk)}">${escapeHTML(lnk)}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </nav>
        ` : ''}
        <div class="oz-header__actions">
          ${hasSearch ? `
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-header-search aria-label="Search">
              <oz-icon name="search" size="14"></oz-icon> <span class="oz-header__search-label">Search</span> <kbd class="oz-header__search-kbd">Ctrl+K</kbd>
            </button>
          ` : ''}
          ${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-oz-header-cta>${escapeHTML(cta)}</button>` : ''}
          ${links.length ? `
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass oz-header__burger" data-oz-header-burger aria-label="Toggle navigation menu" aria-expanded="false">
              <oz-icon name="menu" size="16"></oz-icon>
            </button>
          ` : ''}
        </div>
      </header>
    `;

    const headerEl = this.querySelector('.oz-header') as HTMLElement | null;
    const burgerBtn = this.querySelector('[data-oz-header-burger]') as HTMLButtonElement | null;
    const moreWrap = this.querySelector('.oz-header__more') as HTMLElement | null;
    const moreBtn = this.querySelector('[data-oz-header-more]') as HTMLButtonElement | null;
    const moreMenu = this.querySelector('.oz-header__more-menu') as HTMLElement | null;

    const setMoreOpen = (open: boolean) => {
      if (!moreMenu || !moreBtn) return;
      moreMenu.setAttribute('data-open', open ? 'true' : 'false');
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.style.zIndex = open ? '60' : '';
      if (headerEl) headerEl.style.zIndex = open ? '60' : '';
    };

    moreBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.click();
      setMoreOpen(moreMenu?.getAttribute('data-open') !== 'true');
    });

    if (moreWrap) {
      this.docClickHandler = (e: MouseEvent) => {
        if (moreMenu?.getAttribute('data-open') === 'true' && !moreWrap.contains(e.target as Node)) {
          setMoreOpen(false);
        }
      };
      document.addEventListener('click', this.docClickHandler);
    }

    const selectLink = (link: string) => {
      activeLink = link;
      this.querySelectorAll('[data-oz-header-link]').forEach((b) => {
        const match = (b as HTMLElement).dataset.ozHeaderLink === link;
        b.className = `oz-btn oz-btn--sm ${match ? 'oz-btn--glass' : 'oz-btn--ghost'}`;
      });
      setMoreOpen(false);
      this.dispatchEvent(new CustomEvent('oz-nav', { detail: { link }, bubbles: true }));
      toast({ title: `${brand} Navigation`, message: `Selected "${link}" section.`, variant: 'cyan', duration: 2000 });
    };

    const triggerSearch = () => {
      setMoreOpen(false);
      sound.open();
      const cmd = document.querySelector('oz-command') as (HTMLElement & { open?: () => void }) | null;
      if (cmd?.open) cmd.open();
      else toast({ title: 'Search Triggered', message: 'Header command search activated.', variant: 'cyan' });
    };

    const triggerCta = () => {
      setMoreOpen(false);
      sound.success();
      this.dispatchEvent(new CustomEvent('oz-cta', { detail: { cta, brand }, bubbles: true }));
      toast({ title: cta || 'Action', message: `Executed "${cta}" from ${brand} header.`, variant: 'emerald' });
    };

    const setMenuOpen = (open: boolean) => {
      setMoreOpen(false);
      headerEl?.setAttribute('data-menu-open', open ? 'true' : 'false');
      if (burgerBtn) {
        burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        burgerBtn.querySelector('oz-icon')?.setAttribute('name', open ? 'x' : 'menu');
      }

      if (mobileMenu === 'dropdown') {
        this.cleanupOverlay();
        return;
      }

      if (!open) {
        this.cleanupOverlay();
        return;
      }

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
            <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost oz-mobile-sheet__close" data-oz-mobile-close aria-label="Close navigation menu">
              <oz-icon name="x" size="16"></oz-icon>
            </button>
          </div>
          <nav class="oz-mobile-sheet__nav" aria-label="${escapeHTML(brand)} mobile links">
            ${links.map((lnk) => `
              <button type="button" class="oz-btn oz-btn--sm ${lnk === activeLink ? 'oz-btn--glass' : 'oz-btn--ghost'}" data-oz-mobile-link="${escapeHTML(lnk)}">
                <span>${escapeHTML(lnk)}</span>
                <oz-icon name="arrow-right" size="13" class="oz-subtle"></oz-icon>
              </button>
            `).join('')}
          </nav>
          ${(hasSearch || cta) ? `
            <div class="oz-mobile-sheet__foot">
              ${hasSearch ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-mobile-search style="width:100%;"><oz-icon name="search" size="14"></oz-icon> <span>Search</span></button>` : ''}
              ${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-oz-mobile-cta style="width:100%;">${escapeHTML(cta)}</button>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          sound.click();
          setMenuOpen(false);
        }
      });
      overlay.querySelector('[data-oz-mobile-close]')?.addEventListener('click', () => {
        sound.click();
        setMenuOpen(false);
      });
      overlay.querySelectorAll('[data-oz-mobile-link]').forEach((btn) => {
        btn.addEventListener('click', () => {
          sound.click();
          const link = (btn as HTMLElement).dataset.ozMobileLink || '';
          selectLink(link);
          setMenuOpen(false);
        });
      });
      overlay.querySelector('[data-oz-mobile-search]')?.addEventListener('click', () => {
        setMenuOpen(false);
        triggerSearch();
      });
      overlay.querySelector('[data-oz-mobile-cta]')?.addEventListener('click', () => {
        setMenuOpen(false);
        triggerCta();
      });

      this.escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          sound.click();
          setMenuOpen(false);
        }
      };
      window.addEventListener('keydown', this.escHandler);
      document.body.appendChild(overlay);
      this.overlayEl = overlay;
    };

    burgerBtn?.addEventListener('click', () => {
      sound.click();
      const next = headerEl?.getAttribute('data-menu-open') !== 'true';
      setMenuOpen(next);
    });

    this.querySelectorAll('[data-oz-header-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.click();
        selectLink((btn as HTMLElement).dataset.ozHeaderLink || '');
        setMenuOpen(false);
      });
    });

    this.querySelector('[data-oz-header-search]')?.addEventListener('click', triggerSearch);
    this.querySelector('[data-oz-header-cta]')?.addEventListener('click', triggerCta);
  }
}

// 26. <oz-footer>
interface FooterColumn {
  title: string;
  links: Array<string | { label: string; target?: string }>;
}

export class OzFooter extends OzoneElement {
  static get observedAttributes() {
    return ['variant', 'brand', 'tagline', 'columns', 'status', 'copyright', 'newsletter'];
  }

  protected render() {
    const variant = this.prop('variant', ['type'], 'multi-col');
    const brand = this.prop('brand', ['title'], 'OzoneUI');
    const tagline = this.prop('tagline', [], 'Web-Standards, AI-Native Quad-Domain UI Framework.');
    const status = this.prop('status', [], 'All Systems Operational');
    const copyright = this.prop('copyright', [], `© ${new Date().getFullYear()} ${brand}. Built with Web Standards.`);
    const newsletter = this.boolProp('newsletter');
    const cols = this.jsonProp<FooterColumn[]>('columns', [], []);

    if (variant === 'minimal') {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--minimal">
          <div class="oz-row" style="gap:10px;">
            <oz-icon name="diamond" size="16" style="color:var(--oz-primary);"></oz-icon>
            <strong style="font-weight:600;">${escapeHTML(brand)}</strong>
            <span class="oz-muted oz-text-xs">${escapeHTML(copyright)}</span>
          </div>
          <div class="oz-row" style="gap:12px;">
            ${status ? `<oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge>` : ''}
            ${cols.flatMap((c) => c.links).slice(0, 4).map((l) => {
              const lbl = typeof l === 'string' ? l : l.label;
              const tgt = typeof l === 'string' ? '' : (l.target || '');
              return `<button type="button" class="oz-footer__link" data-footer-link="${escapeHTML(lbl)}" data-footer-target="${escapeHTML(tgt)}">${escapeHTML(lbl)}</button>`;
            }).join('')}
          </div>
        </footer>
      `;
    } else if (variant === 'status') {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--status">
          <div class="oz-row" style="gap:10px;">
            <oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge>
            <span class="oz-muted oz-text-xs">${escapeHTML(tagline)}</span>
          </div>
          <span class="oz-muted oz-text-xs">${escapeHTML(copyright)}</span>
        </footer>
      `;
    } else {
      this.innerHTML = `
        <footer class="oz-footer oz-footer--multi">
          <div class="oz-footer__grid">
            <div class="oz-stack" style="gap:12px;">
              <div class="oz-row" style="gap:10px;">
                <span class="oz-header__logo"><oz-icon name="diamond" size="16"></oz-icon></span>
                <span style="font-weight:700;font-size:1.05rem;">${escapeHTML(brand)}</span>
              </div>
              <p class="oz-text-sm oz-muted" style="max-width:34ch;">${escapeHTML(tagline)}</p>
              ${status ? `<div><oz-badge variant="emerald" pulse>${escapeHTML(status)}</oz-badge></div>` : ''}
              ${newsletter ? `
                <form class="oz-row" data-oz-newsletter style="gap:6px;margin-top:4px;">
                  <input class="oz-input-field" type="email" placeholder="you@company.com" required style="background:var(--oz-surface-inset);border:1px solid var(--oz-border);border-radius:var(--oz-radius-sm);padding:7px 11px;font-size:0.82rem;max-width:200px;" />
                  <button type="submit" class="oz-btn oz-btn--sm oz-btn--primary">Subscribe</button>
                </form>
              ` : ''}
            </div>
            ${cols.map((col) => `
              <div class="oz-stack" style="gap:10px;">
                <div class="oz-footer__col-title">${escapeHTML(col.title)}</div>
                <div class="oz-stack" style="gap:7px;">
                  ${(col.links || []).map((l) => {
                    const lbl = typeof l === 'string' ? l : l.label;
                    const tgt = typeof l === 'string' ? '' : (l.target || '');
                    return `<button type="button" class="oz-footer__link" data-footer-link="${escapeHTML(lbl)}" data-footer-target="${escapeHTML(tgt)}">${escapeHTML(lbl)}</button>`;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="oz-footer__bottom">
            <span class="oz-text-xs oz-muted">${escapeHTML(copyright)}</span>
            <div class="oz-row" style="gap:8px;">
              <span class="oz-text-xs oz-subtle">OKLCH + Web Standards</span>
              <oz-badge variant="cyan" icon="sparkles">Zero Dependencies</oz-badge>
            </div>
          </div>
        </footer>
      `;
    }

    this.querySelectorAll('[data-footer-link]').forEach((el) => {
      el.addEventListener('click', () => {
        const label = (el as HTMLElement).dataset.footerLink || '';
        const target = (el as HTMLElement).dataset.footerTarget || '';
        sound.click();
        this.dispatchEvent(new CustomEvent('oz-footer-nav', { detail: { label, target }, bubbles: true }));
        if (target) {
          const domainBtn = document.querySelector(`[data-domain-btn="${target}"]`) as HTMLElement | null;
          if (domainBtn) {
            domainBtn.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
        toast({ title: 'Footer Link', message: `Navigated to "${label}".`, variant: 'cyan', duration: 2000 });
      });
    });

    this.querySelector('[data-oz-newsletter]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = (e.currentTarget as HTMLFormElement).querySelector('input') as HTMLInputElement;
      const email = inp?.value.trim();
      if (!email) return;
      sound.success();
      inp.value = '';
      toast({ title: 'Subscribed', message: `${email} added to OzoneUI release updates.`, variant: 'emerald' });
    });
  }
}

// 27. <oz-breadcrumbs>
export class OzBreadcrumbs extends OzoneElement {
  static get observedAttributes() {
    return ['items', 'separator'];
  }

  protected render() {
    const raw = this.prop('items', [], 'Home,Workspace,Overview');
    const items = raw.startsWith('[')
      ? (repairJSON<string[]>(raw).data || [])
      : raw.split(',').map((s) => s.trim()).filter(Boolean);
    const sepType = this.prop('separator', [], 'arrow');

    this.innerHTML = `
      <nav class="oz-breadcrumbs" aria-label="Breadcrumb">
        ${items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const sep = idx < items.length - 1
            ? (sepType === 'slash' ? `<span class="oz-subtle">/</span>` : `<oz-icon name="arrow-right" size="12" class="oz-subtle"></oz-icon>`)
            : '';
          return isLast
            ? `<span class="oz-breadcrumbs__current" aria-current="page">${escapeHTML(item)}</span>`
            : `<button type="button" class="oz-breadcrumbs__item" data-crumb-idx="${idx}" data-crumb="${escapeHTML(item)}">${escapeHTML(item)}</button>${sep}`;
        }).join('')}
      </nav>
    `;

    this.querySelectorAll('[data-crumb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const label = (btn as HTMLElement).dataset.crumb || '';
        const index = Number((btn as HTMLElement).dataset.crumbIdx || 0);
        sound.click();
        this.dispatchEvent(new CustomEvent('oz-navigate', { detail: { index, label }, bubbles: true }));
        toast({ title: 'Breadcrumb Navigation', message: `Navigated to "${label}".`, variant: 'cyan', duration: 2000 });
      });
    });
  }
}

// 28. <oz-alert>
export class OzAlert extends OzoneElement {
  static get observedAttributes() {
    return ['variant', 'color', 'type', 'title', 'message', 'icon', 'dismissible', 'cta'];
  }

  protected render() {
    const nodes = this.captureSlotNodes();
    const variant = this.prop('variant', ['color', 'type'], 'cyan');
    const title = this.prop('title');
    const msgAttr = this.prop('message', ['text']);
    const msg = msgAttr || nodes.map((n) => n.textContent).join('').trim();
    const dismissible = this.boolProp('dismissible');
    const cta = this.prop('cta');
    const defaultIcons: Record<string, string> = {
      cyan: 'info', violet: 'sparkles', emerald: 'verified', amber: 'alert-triangle', rose: 'alert-triangle'
    };
    const icon = this.prop('icon') || defaultIcons[variant] || 'info';

    this.innerHTML = `
      <div class="oz-alert oz-alert--${escapeHTML(variant)}" role="alert">
        <oz-icon name="${escapeHTML(icon)}" size="18" class="oz-alert__icon"></oz-icon>
        <div style="flex:1;min-width:0;">
          ${title ? `<div class="oz-alert__title">${escapeHTML(title)}</div>` : ''}
          ${msg ? `<div class="oz-alert__msg">${escapeHTML(msg)}</div>` : ''}
        </div>
        <div class="oz-row" style="gap:6px;flex-shrink:0;">
          ${cta ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-alert-cta>${escapeHTML(cta)}</button>` : ''}
          ${dismissible ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-alert-dismiss aria-label="Dismiss"><oz-icon name="x" size="14"></oz-icon></button>` : ''}
        </div>
      </div>
    `;

    this.querySelector('[data-alert-cta]')?.addEventListener('click', () => {
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-alert-action', { detail: { title, cta }, bubbles: true }));
      toast({ title: cta || 'Action', message: `Executed "${cta}".`, variant: 'cyan' });
    });

    this.querySelector('[data-alert-dismiss]')?.addEventListener('click', () => {
      sound.click();
      this.style.opacity = '0';
      this.style.transform = 'scale(0.98)';
      this.style.transition = 'all 180ms ease';
      setTimeout(() => this.remove(), 190);
    });
  }
}

// 29. <oz-progress>
export class OzProgress extends OzoneElement {
  static get observedAttributes() {
    return ['value', 'max', 'label', 'variant', 'color', 'show-value', 'indeterminate'];
  }

  protected render() {
    const val = this.numProp('value', [], 64);
    const max = Math.max(1, this.numProp('max', [], 100));
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    const label = this.prop('label', ['title']);
    const variant = this.prop('variant', ['color'], 'cyan');
    const showValue = this.boolProp('show-value') || Boolean(label);
    const indet = this.boolProp('indeterminate');

    this.innerHTML = `
      <div class="oz-progress">
        ${(label || showValue) ? `
          <div class="oz-between oz-text-xs" style="margin-bottom:6px;">
            <span class="oz-muted" style="font-weight:500;">${escapeHTML(label)}</span>
            ${showValue ? `<span style="font-weight:600;">${indet ? 'Syncing...' : `${Math.round(pct)}%`}</span>` : ''}
          </div>
        ` : ''}
        <div class="oz-progress__track" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
          <div class="oz-progress__fill oz-progress__fill--${escapeHTML(variant)} ${indet ? 'oz-progress__fill--indet' : ''}" style="width:${indet ? '42%' : pct.toFixed(1) + '%'};"></div>
        </div>
      </div>
    `;
  }
}

// 30. <oz-accordion>
interface AccordionItem {
  title: string;
  content: string;
  open?: boolean;
}

export class OzAccordion extends OzoneElement {
  static get observedAttributes() {
    return ['items', 'multiple'];
  }

  private openSet = new Set<number>();

  protected render() {
    const items = this.jsonProp<AccordionItem[]>('items', [], []);
    const multiple = this.boolProp('multiple');

    if (!this._mounted) {
      this._mounted = true;
      items.forEach((it, i) => {
        if (it.open) this.openSet.add(i);
      });
      if (this.openSet.size === 0 && items.length > 0) {
        this.openSet.add(0);
      }
    }

    this.innerHTML = `
      <div class="oz-accordion">
        ${items.map((it, idx) => {
          const isOpen = this.openSet.has(idx);
          return `
            <div class="oz-accordion__item" data-open="${isOpen}">
              <button type="button" class="oz-accordion__trigger" data-acc-idx="${idx}" aria-expanded="${isOpen}">
                <span>${escapeHTML(it.title)}</span>
                <oz-icon name="chevron-down" size="16" class="oz-accordion__chev"></oz-icon>
              </button>
              ${isOpen ? `<div class="oz-accordion__body">${escapeHTML(it.content)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.querySelectorAll('[data-acc-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn as HTMLElement).dataset.accIdx || 0);
        const wasOpen = this.openSet.has(idx);
        if (!multiple) this.openSet.clear();
        if (wasOpen) this.openSet.delete(idx);
        else this.openSet.add(idx);
        sound.click();
        morph(() => this.safeRender());
      });
    });
  }
}

// 31. <oz-timeline>
interface TimelineItem {
  time: string;
  title: string;
  desc?: string;
  status?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
}

export class OzTimeline extends OzoneElement {
  static get observedAttributes() {
    return ['items'];
  }

  protected render() {
    const items = this.jsonProp<TimelineItem[]>('items', [], []);
    this.innerHTML = `
      <div class="oz-timeline">
        ${items.map((it) => `
          <div class="oz-timeline__item">
            <span class="oz-timeline__dot oz-timeline__dot--${escapeHTML(it.status || 'cyan')}"></span>
            <div class="oz-timeline__content">
              <div class="oz-between" style="gap:8px;">
                <span style="font-weight:600;font-size:0.9rem;">${escapeHTML(it.title)}</span>
                <span class="oz-text-xs oz-subtle">${escapeHTML(it.time)}</span>
              </div>
              ${it.desc ? `<div class="oz-text-xs oz-muted" style="margin-top:3px;">${escapeHTML(it.desc)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}
