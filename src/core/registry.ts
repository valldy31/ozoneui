// ============================================================================
// OzoneUI Registry, View Transitions Morph, Mode Controllers & AI Introspection
// ============================================================================
import { dna } from './dna.ts';
import { sound } from './sound.ts';
import { toast } from './toast.ts';
import { agent } from './agent.ts';
import { signal, computed, effect } from './signal.ts';
import { icons } from '../components/icon.ts';

export interface ComponentSchemaEntry {
  tag: string;
  domain: string;
  description: string;
  props: string[];
}

export const COMPONENT_MANIFEST: ComponentSchemaEntry[] = [
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
  { tag: 'oz-timeline', domain: 'layout', description: 'Vertical activity, audit, and roadmap timeline', props: ['items(JSON)'] }
];

export function registerComponent(tag: string, ctor: CustomElementConstructor) {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}

export function morph(updateFn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  if (typeof doc.startViewTransition === 'function' && document.documentElement.dataset.ozPerf !== 'eco') {
    doc.startViewTransition(updateFn);
  } else {
    updateFn();
  }
}

export function setMode(mode: 'atmospheric' | 'precision') {
  morph(() => {
    document.documentElement.dataset.ozMode = mode;
    document.documentElement.dataset.ozDna = dna.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: dna.read() }));
  });
}

export function setTheme(theme: 'dark' | 'light') {
  morph(() => {
    document.documentElement.dataset.ozTheme = theme;
    document.documentElement.dataset.ozDna = dna.encode();
    window.dispatchEvent(new CustomEvent('oz-dna-change', { detail: dna.read() }));
  });
}

export function setPrivacyMode(enabled: boolean) {
  document.documentElement.dataset.ozPrivacy = enabled ? 'true' : 'false';
  sound.toggle(enabled);
  window.dispatchEvent(new CustomEvent('oz-privacy-change', { detail: { enabled } }));
}

export function setSound(enabled: boolean) {
  document.documentElement.dataset.ozSound = enabled ? 'on' : 'off';
  document.documentElement.dataset.ozDna = dna.encode();
  if (enabled) sound.toggle(true);
}

export function inspectUI() {
  const nodes = Array.from(document.querySelectorAll(COMPONENT_MANIFEST.map((c) => c.tag).join(',')));
  return nodes.map((el, index) => {
    const tag = el.tagName.toLowerCase();
    const label = el.getAttribute('title') || el.getAttribute('label') || el.textContent?.trim().slice(0, 48) || tag;
    return {
      index,
      tag,
      id: el.id || null,
      label,
      visible: (el as HTMLElement).offsetParent !== null
    };
  });
}

export function getSchemaManifest() {
  return {
    framework: 'OzoneUI',
    version: '1.0.0',
    totalComponents: COMPONENT_MANIFEST.length,
    components: COMPONENT_MANIFEST
  };
}

export function getAIPrompt(): string {
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
  for (const c of COMPONENT_MANIFEST) {
    lines.push(`- <${c.tag}> (${c.domain}): ${c.description}. Props: ${c.props.join(', ')}`);
  }
  lines.push('', 'JSON Rendering: Pass {"type":"oz-bento","props":{"cols":3},"children":[...]} to <oz-renderer schema="...">.');
  return lines.join('\n');
}

export const Ozone = {
  version: '1.0.0',
  signal,
  computed,
  effect,
  sound,
  dna,
  toast,
  agent,
  icons,
  morph,
  setMode,
  setTheme,
  setPrivacyMode,
  setSound,
  inspectUI,
  getSchemaManifest,
  getAIPrompt
};
