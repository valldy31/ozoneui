// ============================================================================
// OzoneUI Pack D: Sophisticated Marketplaces & Next-Gen Social Networks
// <oz-product-card>, <oz-rating>, <oz-post>, <oz-composer>
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';

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
    return ['title', 'price', 'old-price', 'rating', 'reviews', 'badge', 'category', 'seller', 'gradient', 'image', 'icon'];
  }

  private wishlisted = false;

  protected render() {
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

    this.innerHTML = `
      <div class="oz-product__media" style="background:${bgMap[gradient] || bgMap.cyan};">
        <div class="oz-product__media-inner">
          ${image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(title)}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<div style="width:82px;height:82px;border-radius:22px;background:oklch(1 0 0 / 0.12);border:1px solid oklch(1 0 0 / 0.28);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 16px 36px oklch(0 0 0 / 0.35);"><oz-icon name="${escapeHTML(mediaIcon)}" size="34"></oz-icon></div>`
          }
        </div>
        <div style="position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:2;">
          ${badge ? `<oz-badge variant="${escapeHTML(gradient)}" pulse>${escapeHTML(badge)}</oz-badge>` : '<span></span>'}
          <button type="button" data-oz-wish aria-label="Wishlist" style="width:32px;height:32px;border-radius:50%;border:1px solid oklch(1 0 0 / 0.22);background:oklch(0.1 0.02 220 / 0.55);backdrop-filter:blur(8px);color:${this.wishlisted ? 'var(--oz-rose)' : 'white'};cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <oz-icon name="${this.wishlisted ? 'heart-filled' : 'heart'}" size="15"></oz-icon>
          </button>
        </div>
      </div>
      <div class="oz-product__body">
        <div class="oz-between">
          <span class="oz-text-xs oz-muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">${escapeHTML(category)}</span>
          <oz-rating value="${escapeHTML(rating)}" reviews="${escapeHTML(reviews)}"></oz-rating>
        </div>
        <div style="font-size:1.03rem;font-weight:600;letter-spacing:-0.015em;">${escapeHTML(title)}</div>
        <div class="oz-text-xs oz-muted">by <span style="color:var(--oz-text);font-weight:500;">${escapeHTML(seller)}</span></div>
        <div class="oz-product__price-row">
          <div style="display:flex;align-items:baseline;gap:7px;">
            <span style="font-size:1.25rem;font-weight:700;">${escapeHTML(price)}</span>
            ${oldPrice ? `<span class="oz-subtle oz-text-xs" style="text-decoration:line-through;">${escapeHTML(oldPrice)}</span>` : ''}
          </div>
          <div class="oz-row" style="gap:6px;">
            <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-preview>Inspect</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-oz-buy>Add</button>
          </div>
        </div>
      </div>
    `;

    this.querySelector('[data-oz-wish]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.wishlisted = !this.wishlisted;
      sound.toggle(this.wishlisted);
      this.safeRender();
    });

    this.querySelector('[data-oz-buy]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.success();
      this.dispatchEvent(new CustomEvent('oz-add-cart', {
        detail: { title, price, seller, category },
        bubbles: true
      }));
      toast({ title: 'Added to Cart', message: `${title} (${price}) added.`, variant: 'emerald' });
    });

    this.querySelector('[data-oz-preview]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.open();
      this.dispatchEvent(new CustomEvent('oz-product-preview', {
        detail: { title, price, oldPrice, rating, reviews, badge, category, seller, gradient },
        bubbles: true
      }));
    });
  }
}

// 20. <oz-post>
export class OzPost extends OzoneElement {
  static get observedAttributes() {
    return ['author', 'handle', 'verified', 'status', 'time', 'likes', 'comments', 'shares', 'tags', 'content'];
  }

  private liked = false;
  private bookmarked = false;
  private reposted = false;

  protected render() {
    const nodes = this.captureSlotNodes();
    const author = this.prop('author', ['name'], 'Elena Vance');
    const handle = this.prop('handle', [], '@elena_ai');
    const verified = this.boolProp('verified');
    const status = this.prop('status', [], 'online');
    const time = this.prop('time', [], 'Just now');
    const tags = this.prop('tags', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const content = this.prop('content', ['text']) || nodes.map((n) => n.textContent).join('').trim();

    const baseLikes = Math.floor(this.numProp('likes', [], 42));
    const baseComments = Math.floor(this.numProp('comments', [], 7));
    const baseShares = Math.floor(this.numProp('shares', [], 5));

    const likeCount = baseLikes + (this.liked ? 1 : 0);
    const shareCount = baseShares + (this.reposted ? 1 : 0);

    this.innerHTML = `
      <div class="oz-post__head">
        <div class="oz-post__author">
          <oz-avatar name="${escapeHTML(author)}" status="${escapeHTML(status)}" ${verified ? 'verified' : ''} size="42"></oz-avatar>
          <div>
            <div style="font-weight:600;font-size:0.95rem;">${escapeHTML(author)}</div>
            <div class="oz-text-xs oz-muted">${escapeHTML(handle)} · ${escapeHTML(time)}</div>
          </div>
        </div>
        <oz-badge variant="violet">Creator</oz-badge>
      </div>
      <div class="oz-post__content">${escapeHTML(content)}</div>
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
          <oz-icon name="${this.bookmarked ? 'bookmark-filled' : 'bookmark'}" size="14"></oz-icon> <span>${this.bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    `;

    this.querySelector('[data-like]')?.addEventListener('click', () => {
      this.liked = !this.liked;
      sound.toggle(this.liked);
      this.safeRender();
    });
    this.querySelector('[data-repost]')?.addEventListener('click', () => {
      this.reposted = !this.reposted;
      sound.click();
      this.safeRender();
      if (this.reposted) toast({ title: 'Reposted', message: `Shared ${handle}'s post to your network.`, variant: 'cyan', duration: 2000 });
    });
    this.querySelector('[data-bookmark]')?.addEventListener('click', () => {
      this.bookmarked = !this.bookmarked;
      sound.toggle(this.bookmarked);
      this.safeRender();
    });
    this.querySelector('[data-comment]')?.addEventListener('click', () => {
      sound.click();
      toast({ title: 'Thread Open', message: `Viewing ${baseComments} replies on ${handle}'s post.`, variant: 'violet', duration: 2200 });
    });
  }
}

// 21. <oz-composer>
export class OzComposer extends OzoneElement {
  static get observedAttributes() {
    return ['placeholder', 'target', 'author', 'handle'];
  }

  protected render() {
    const placeholder = this.prop('placeholder', [], 'Broadcast an idea, launch update, or AI prompt...');
    const targetSel = this.prop('target');
    const author = this.prop('author', [], 'You');
    const handle = this.prop('handle', [], '@creator');

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
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glow" data-publish>Publish Post</button>
          </div>
        </div>
      </div>
    `;

    const textarea = this.querySelector('textarea')!;
    this.querySelector('[data-publish]')?.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) {
        toast({ title: 'Empty Post', message: 'Write something before publishing.', variant: 'amber', duration: 2000 });
        return;
      }

      sound.success();
      this.dispatchEvent(new CustomEvent('oz-publish', { detail: { content, author, handle }, bubbles: true }));

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
      toast({ title: 'Published Live', message: 'Your post is now live on the network.', variant: 'emerald' });
    });
  }
}
