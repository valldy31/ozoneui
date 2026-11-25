// ============================================================================
// OzoneUI Pack D: Sophisticated Marketplaces & Next-Gen Social Networks
// <oz-product-card>, <oz-rating>, <oz-post>, <oz-composer>
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';
import { i18n, safeHref } from '../core/i18n.ts';

// 18. <oz-rating>
export class OzRating extends OzoneElement {
  static get observedAttributes() {
    return ['value', 'max', 'interactive', 'reviews'];
  }

  protected render() {
    const value = this.numProp('value', [], 4.9);
    const max = Math.max(1, Math.floor(this.numProp('max', [], 5)));
    const interactive = this.boolProp('interactive');
    const reviews = this.prop('reviews');

    const stars = Array.from({ length: max }, (_, i) => {
      const filled = i + 1 <= Math.round(value);
      return `<span class="oz-rating__star ${filled ? 'oz-rating__star--filled' : ''}" data-star="${i + 1}"><oz-icon name="${filled ? 'star-filled' : 'star'}" size="14"></oz-icon></span>`;
    }).join('');

    this.innerHTML = `
      ${stars}
      <span style="margin-left:4px;font-weight:600;font-size:0.82rem;">${value.toFixed(1)}</span>
      ${reviews ? `<span class="oz-muted oz-text-xs">(${escapeHTML(reviews)})</span>` : ''}
    `;

    if (interactive) {
      this.querySelectorAll('[data-star]').forEach((star) => {
        star.addEventListener('click', (e) => {
          e.stopPropagation();
          const next = Number((star as HTMLElement).dataset.star || 5);
          this.setAttribute('value', String(next));
          sound.click();
          this.dispatchEvent(new CustomEvent('oz-rate', { detail: { value: next }, bubbles: true }));
        });
      });
    }
  }
}

// 19. <oz-product-card>
export class OzProductCard extends OzoneElement {
  static get observedAttributes() {
    return [
      'title', 'price', 'old-price', 'rating', 'reviews', 'badge', 'category',
      'seller', 'gradient', 'image', 'icon', 'aspect', 'no-tilt', 'no-toast',
      'cta-label', 'cta-href', 'secondary-label', 'secondary-href', 'secondary-icon',
      'sold-out', 'sold-out-label', 'unit', 'stock-percent', 'stock-label', 'by-label',
      'wishlisted'
    ];
  }

  private wishlisted = false;
  private _wishInit = false;
  private _i18nBound = false;

  protected render() {
    if (!this._i18nBound) {
      this._i18nBound = true;
      window.addEventListener('oz-i18n-change', () => {
        if (this.isConnected) this.safeRender();
      });
    }
    if (!this._wishInit) {
      this._wishInit = true;
      this.wishlisted = this.boolProp('wishlisted');
    }

    const disableTilt = this.boolProp('no-tilt') || document.documentElement.dataset.ozMode === 'precision';
    if (disableTilt) {
      this.removeAttribute('tilt');
      this.style.setProperty('--oz-tilt-x', '0deg');
      this.style.setProperty('--oz-tilt-y', '0deg');
    } else if (!this.hasAttribute('tilt')) {
      this.setAttribute('tilt', '');
    }

    const title = this.prop('title', ['name'], 'Quantum Asset');
    const price = this.prop('price', [], '$79');
    const oldPrice = this.prop('old-price', ['old_price', 'oldPrice', 'compare-at']);
    const unit = this.prop('unit');
    const hasRatingAttr = this.hasAttribute('rating');
    const rawRating = this.getAttribute('rating');
    const showRating = !(hasRatingAttr && rawRating === '');
    const rating = this.prop('rating', [], '4.9');
    const reviews = this.prop('reviews', [], '128');
    const soldOut = this.boolProp('sold-out');
    const badge = this.prop('badge') || (soldOut ? i18n.t('soldOut') : '');
    const category = this.prop('category', [], 'Digital Asset');
    const hasSellerAttr = this.hasAttribute('seller');
    const seller = hasSellerAttr ? (this.getAttribute('seller') || '').trim() : 'Aether Studio';
    const byLabel = this.prop('by-label') || i18n.t('by');
    const gradient = this.prop('gradient', ['glow'], 'cyan');
    const image = this.prop('image', ['src']);
    const aspect = this.prop('aspect');
    const aspectCss = aspect ? aspect.replace(':', '/') : '';
    const noToast = this.boolProp('no-toast');
    const ctaLabel = this.prop('cta-label') || i18n.t('add');
    const ctaHref = this.prop('cta-href');
    const secLabel = this.hasAttribute('secondary-label')
      ? (this.getAttribute('secondary-label') || '').trim()
      : i18n.t('inspect');
    const secHref = this.prop('secondary-href');
    const secIcon = this.prop('secondary-icon');
    const soldOutLabel = this.prop('sold-out-label') || i18n.t('notifyMe');

    const hasStock = this.hasAttribute('stock-percent');
    const stockPct = hasStock ? Math.max(0, Math.min(100, this.numProp('stock-percent', [], 100))) : 100;
    const stockLabel = this.prop('stock-label');
    const stockTone = stockPct <= 20 ? 'rose' : stockPct <= 50 ? 'amber' : 'emerald';

    const catIconMap: Record<string, string> = {
      Shaders: 'sparkles',
      'AI Agents': 'bot',
      Audio: 'music',
      Templates: 'layers'
    };
    const mediaIcon = this.prop('icon') || catIconMap[category] || 'diamond';

    const bgMap: Record<string, string> = {
      cyan: 'linear-gradient(135deg, oklch(0.32 0.14 205), oklch(0.24 0.18 265))',
      violet: 'linear-gradient(135deg, oklch(0.32 0.18 285), oklch(0.24 0.16 325))',
      emerald: 'linear-gradient(135deg, oklch(0.32 0.15 155), oklch(0.22 0.14 200))',
      amber: 'linear-gradient(135deg, oklch(0.38 0.16 75), oklch(0.26 0.16 25))',
      rose: 'linear-gradient(135deg, oklch(0.35 0.18 15), oklch(0.24 0.17 295))'
    };

    const mediaStyle = `background:${bgMap[gradient] || bgMap.cyan};${aspectCss ? `aspect-ratio:${escapeHTML(aspectCss)};height:auto;` : ''}`;
    const secondaryBtnHTML = secLabel
      ? (secHref
        ? `<a class="oz-btn oz-btn--sm oz-btn--ghost" href="${escapeHTML(safeHref(secHref))}"${secHref.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''} data-oz-secondary>${secIcon ? `<oz-icon name="${escapeHTML(secIcon)}" size="13"></oz-icon>` : ''}${escapeHTML(secLabel)}</a>`
        : `<button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-preview>${secIcon ? `<oz-icon name="${escapeHTML(secIcon)}" size="13"></oz-icon>` : ''}${escapeHTML(secLabel)}</button>`)
      : '';
    const primaryBtnHTML = soldOut
      ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-notify>${escapeHTML(soldOutLabel)}</button>`
      : (ctaHref
        ? `<a class="oz-btn oz-btn--sm oz-btn--primary" href="${escapeHTML(safeHref(ctaHref))}" data-oz-buy>${escapeHTML(ctaLabel)}</a>`
        : `<button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-oz-buy>${escapeHTML(ctaLabel)}</button>`);

    this.innerHTML = `
      <div class="oz-product__media"${aspectCss ? ` data-aspect="${escapeHTML(aspectCss)}"` : ''} style="${mediaStyle}">
        <div class="oz-product__media-inner">
          ${image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(title)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;${soldOut ? 'filter:grayscale(0.55) opacity(0.8);' : ''}" />`
            : `<div style="width:82px;height:82px;border-radius:22px;background:oklch(1 0 0 / 0.12);border:1px solid oklch(1 0 0 / 0.28);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 16px 36px oklch(0 0 0 / 0.35);"><oz-icon name="${escapeHTML(mediaIcon)}" size="34"></oz-icon></div>`
          }
        </div>
        <div style="position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:2;">
          ${badge ? `<oz-badge variant="${escapeHTML(soldOut ? 'rose' : gradient)}"${soldOut ? '' : ' pulse'}>${escapeHTML(badge)}</oz-badge>` : '<span></span>'}
          <button type="button" data-oz-wish aria-label="${escapeHTML(i18n.t('wishlist'))}" style="width:32px;height:32px;border-radius:50%;border:1px solid oklch(1 0 0 / 0.22);background:oklch(0.1 0.02 220 / 0.55);backdrop-filter:blur(8px);color:${this.wishlisted ? 'var(--oz-rose)' : 'white'};cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <oz-icon name="${this.wishlisted ? 'heart-filled' : 'heart'}" size="15"></oz-icon>
          </button>
        </div>
      </div>
      <div class="oz-product__body">
        <div class="oz-between">
          <span class="oz-text-xs oz-muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">${escapeHTML(category)}</span>
          ${showRating ? `<oz-rating value="${escapeHTML(rating)}" reviews="${escapeHTML(reviews)}"></oz-rating>` : ''}
        </div>
        <div style="font-size:1.03rem;font-weight:600;letter-spacing:-0.015em;">${escapeHTML(title)}</div>
        ${seller ? `<div class="oz-text-xs oz-muted">${escapeHTML(byLabel)} <span style="color:var(--oz-text);font-weight:500;">${escapeHTML(seller)}</span></div>` : ''}
        ${hasStock ? `
          <div class="oz-product__stock">
            ${stockLabel ? `<div class="oz-between oz-text-xs"><span class="oz-muted">${escapeHTML(stockLabel)}</span><span style="font-weight:600;">${Math.round(stockPct)}%</span></div>` : ''}
            <div class="oz-product__stock-bar"><div class="oz-product__stock-fill oz-product__stock-fill--${stockTone}" style="width:${stockPct.toFixed(1)}%;"></div></div>
          </div>
        ` : ''}
        <div class="oz-product__price-row">
          <div style="display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;">
            <span style="font-size:1.25rem;font-weight:700;">${escapeHTML(price)}</span>
            ${unit ? `<span class="oz-product__unit">/ ${escapeHTML(unit)}</span>` : ''}
            ${oldPrice ? `<span class="oz-subtle oz-text-xs" style="text-decoration:line-through;">${escapeHTML(oldPrice)}</span>` : ''}
          </div>
          <div class="oz-row" style="gap:6px;">
            ${secondaryBtnHTML}
            ${primaryBtnHTML}
          </div>
        </div>
      </div>
    `;

    this.querySelector('[data-oz-wish]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.wishlisted = !this.wishlisted;
      sound.toggle(this.wishlisted);
      this.dispatchEvent(new CustomEvent('oz-wishlist', {
        detail: { title, price, wishlisted: this.wishlisted },
        bubbles: true
      }));
      this.safeRender();
    });

    this.querySelector('[data-oz-buy]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.success();
      const ev = new CustomEvent('oz-add-cart', {
        detail: { title, price, unit, seller, category },
        bubbles: true,
        cancelable: true
      });
      this.dispatchEvent(ev);
      if (!ev.defaultPrevented && !noToast) {
        toast({ title: i18n.t('addedToCart'), message: i18n.t('addedToCartMsg', { title, price }), variant: 'emerald' });
      }
    });

    this.querySelector('[data-oz-notify]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.click();
      const ev = new CustomEvent('oz-notify', {
        detail: { title, price, unit, seller, category, soldOut: true },
        bubbles: true,
        cancelable: true
      });
      this.dispatchEvent(ev);
      if (!ev.defaultPrevented && !noToast) {
        toast({ title: i18n.t('notifyTitle'), message: i18n.t('notifyMsg', { title }), variant: 'amber' });
      }
    });

    this.querySelector('[data-oz-preview]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.open();
      this.dispatchEvent(new CustomEvent('oz-product-preview', {
        detail: { title, price, oldPrice, unit, rating, reviews, badge, category, seller, gradient },
        bubbles: true
      }));
    });
  }
}

// 20. <oz-post>
export class OzPost extends OzoneElement {
  static get observedAttributes() {
    return [
      'author', 'handle', 'avatar', 'verified', 'status', 'time',
      'likes', 'comments', 'shares', 'tags', 'content',
      'image', 'image-alt', 'aspect', 'badge', 'badge-variant',
      'liked', 'bookmarked', 'save-label', 'saved-label', 'no-toast'
    ];
  }

  private liked = false;
  private bookmarked = false;
  private reposted = false;
  private _stateInit = false;
  private _i18nBound = false;

  protected render() {
    if (!this._i18nBound) {
      this._i18nBound = true;
      window.addEventListener('oz-i18n-change', () => {
        if (this.isConnected) this.safeRender();
      });
    }
    if (!this._stateInit) {
      this._stateInit = true;
      this.liked = this.boolProp('liked');
      this.bookmarked = this.boolProp('bookmarked');
    }

    const nodes = this.captureSlotNodes();
    const author = this.prop('author', ['name'], 'Elena Vance');
    const handle = this.prop('handle', [], '@elena_ai');
    const avatar = this.prop('avatar');
    const verified = this.boolProp('verified');
    const status = this.prop('status', [], 'online');
    const time = this.prop('time', [], 'Just now');
    const tags = this.prop('tags', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const content = this.prop('content', ['text']) || nodes.map((n) => n.textContent).join('').trim();
    const image = this.prop('image', ['src']);
    const imageAlt = this.prop('image-alt') || author;
    const aspect = (this.prop('aspect', [], '16/9')).replace(':', '/');
    const hasBadgeAttr = this.hasAttribute('badge');
    const badgeText = hasBadgeAttr ? (this.getAttribute('badge') || '').trim() : i18n.t('creator');
    const badgeVariant = this.prop('badge-variant', [], 'violet');
    const saveLabel = this.prop('save-label') || i18n.t('save');
    const savedLabel = this.prop('saved-label') || i18n.t('saved');
    const noToast = this.boolProp('no-toast');

    const baseLikes = Math.floor(this.numProp('likes', [], 42));
    const baseComments = Math.floor(this.numProp('comments', [], 7));
    const baseShares = Math.floor(this.numProp('shares', [], 5));

    const likeCount = baseLikes + (this.liked ? 1 : 0);
    const shareCount = baseShares + (this.reposted ? 1 : 0);

    this.innerHTML = `
      <div class="oz-post__head">
        <div class="oz-post__author">
          <oz-avatar name="${escapeHTML(author)}"${avatar ? ` src="${escapeHTML(avatar)}"` : ''} status="${escapeHTML(status)}" ${verified ? 'verified' : ''} size="42"></oz-avatar>
          <div>
            <div style="font-weight:600;font-size:0.95rem;">${escapeHTML(author)}</div>
            <div class="oz-text-xs oz-muted">${escapeHTML(handle)} · ${escapeHTML(time)}</div>
          </div>
        </div>
        ${badgeText ? `<oz-badge variant="${escapeHTML(badgeVariant)}">${escapeHTML(badgeText)}</oz-badge>` : ''}
      </div>
      <div class="oz-post__content">${escapeHTML(content)}</div>
      ${image ? `
        <div class="oz-post__media" style="aspect-ratio:${escapeHTML(aspect)};">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(imageAlt)}" loading="lazy" decoding="async" />
        </div>
      ` : ''}
      ${tags.length ? `
        <div class="oz-row" style="gap:6px;margin-bottom:12px;">
          ${tags.map((t) => `<oz-badge variant="cyan">#${escapeHTML(t)}</oz-badge>`).join('')}
        </div>
      ` : ''}
      <div class="oz-post__actions">
        <button type="button" class="oz-post__action-btn" data-like data-active="${this.liked}">
          <oz-icon name="${this.liked ? 'heart-filled' : 'heart'}" size="14"></oz-icon> <span>${likeCount.toLocaleString()}</span>
        </button>
        <button type="button" class="oz-post__action-btn" data-comment>
          <oz-icon name="message-circle" size="14"></oz-icon> <span>${baseComments}</span>
        </button>
        <button type="button" class="oz-post__action-btn" data-repost data-active="${this.reposted}">
          <oz-icon name="repeat" size="14"></oz-icon> <span>${shareCount}</span>
        </button>
        <button type="button" class="oz-post__action-btn" data-bookmark data-active="${this.bookmarked}" style="margin-left:auto;">
          <oz-icon name="${this.bookmarked ? 'bookmark-filled' : 'bookmark'}" size="14"></oz-icon> <span>${escapeHTML(this.bookmarked ? savedLabel : saveLabel)}</span>
        </button>
      </div>
    `;

    this.querySelector('[data-like]')?.addEventListener('click', () => {
      this.liked = !this.liked;
      sound.toggle(this.liked);
      this.dispatchEvent(new CustomEvent('oz-like', { detail: { liked: this.liked, author, handle }, bubbles: true, cancelable: true }));
      this.safeRender();
    });
    this.querySelector('[data-repost]')?.addEventListener('click', () => {
      this.reposted = !this.reposted;
      sound.click();
      const ev = new CustomEvent('oz-repost', { detail: { reposted: this.reposted, author, handle }, bubbles: true, cancelable: true });
      this.dispatchEvent(ev);
      this.safeRender();
      if (this.reposted && !ev.defaultPrevented && !noToast) {
        toast({ title: i18n.t('reposted'), message: i18n.t('repostedMsg', { handle }), variant: 'cyan', duration: 2000 });
      }
    });
    this.querySelector('[data-bookmark]')?.addEventListener('click', () => {
      this.bookmarked = !this.bookmarked;
      sound.toggle(this.bookmarked);
      this.dispatchEvent(new CustomEvent('oz-bookmark', { detail: { bookmarked: this.bookmarked, author, handle }, bubbles: true, cancelable: true }));
      this.safeRender();
    });
    this.querySelector('[data-comment]')?.addEventListener('click', () => {
      sound.click();
      const ev = new CustomEvent('oz-comment', { detail: { author, handle, comments: baseComments }, bubbles: true, cancelable: true });
      this.dispatchEvent(ev);
      if (!ev.defaultPrevented && !noToast) {
        toast({ title: i18n.t('threadOpen'), message: i18n.t('threadOpenMsg', { comments: baseComments, handle }), variant: 'violet', duration: 2200 });
      }
    });
  }
}

// 21. <oz-composer>
export class OzComposer extends OzoneElement {
  static get observedAttributes() {
    return ['placeholder', 'target', 'author', 'handle', 'publish-label', 'no-toast'];
  }

  private _i18nBound = false;

  protected render() {
    if (!this._i18nBound) {
      this._i18nBound = true;
      window.addEventListener('oz-i18n-change', () => {
        if (this.isConnected) this.safeRender();
      });
    }
    const placeholder = this.prop('placeholder', [], 'Broadcast an idea, launch update, or AI prompt...');
    const targetSel = this.prop('target');
    const author = this.prop('author', [], 'You');
    const handle = this.prop('handle', [], '@creator');
    const publishLabel = this.prop('publish-label') || i18n.t('publishPost');
    const noToast = this.boolProp('no-toast');

    this.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <oz-avatar name="${escapeHTML(author)}" status="streaming" verified size="42"></oz-avatar>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;">
          <textarea class="oz-composer__textarea" placeholder="${escapeHTML(placeholder)}"></textarea>
          <div class="oz-between">
            <div class="oz-row" style="gap:6px;">
              <oz-badge variant="cyan">#OzoneUI</oz-badge>
              <oz-badge variant="violet">#FutureWeb</oz-badge>
            </div>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-publish>${escapeHTML(publishLabel)}</button>
          </div>
        </div>
      </div>
    `;

    const textarea = this.querySelector('textarea')!;
    this.querySelector('[data-publish]')?.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) {
        if (!noToast) toast({ title: i18n.t('emptyPost'), message: i18n.t('emptyPostMsg'), variant: 'amber', duration: 2000 });
        return;
      }

      sound.success();
      const ev = new CustomEvent('oz-publish', { detail: { content, author, handle }, bubbles: true, cancelable: true });
      this.dispatchEvent(ev);

      if (targetSel) {
        const feed = document.querySelector(targetSel);
        if (feed) {
          const post = document.createElement('oz-post');
          post.setAttribute('author', author);
          post.setAttribute('handle', handle);
          post.setAttribute('verified', '');
          post.setAttribute('status', 'streaming');
          post.setAttribute('time', 'Just now');
          post.setAttribute('likes', '1');
          post.setAttribute('comments', '0');
          post.setAttribute('shares', '0');
          post.setAttribute('tags', 'OzoneUI,FutureWeb');
          post.setAttribute('content', content);
          morph(() => {
            feed.prepend(post);
          });
        }
      }

      textarea.value = '';
      if (!ev.defaultPrevented && !noToast) {
        toast({ title: i18n.t('publishedLive'), message: i18n.t('publishedLiveMsg'), variant: 'emerald' });
      }
    });
  }
}
