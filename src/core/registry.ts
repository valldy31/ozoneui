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

export function registerComponent(tag: string, ctor: CustomElementConstructor) {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}

export function morph(updateFn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  if (typeof doc.startViewTransition === 'function' && document.documentElement.dataset.ozPerf !== 'eco') {
    const vt = doc.startViewTransition(updateFn); vt?.finished?.catch(() => {}); vt?.ready?.catch(() => {}); vt?.updateCallbackDone?.catch(() => {});
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
