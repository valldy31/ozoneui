// ============================================================================
// OzoneUI Universal 4-Mode <oz-icon> Vector Engine & Ozone.icons API
// Mode 1: Instant 0ms Built-In Lucide Geometric Vector Dictionary (60+ icons)
// Mode 2: Multi-Pack Iconify SVG Loader (lucide, ph, tabler, solar, heroicons, mdi)
// Mode 3: Developer Registry & Custom Resolver (Ozone.icons.register / setResolver)
// Mode 4: Inline <svg> Slot, External src="" SVG, or CSS Icon Font (icon-class="")
// ============================================================================
import { OzoneElement, escapeHTML } from '../core/element.ts';

export type OzoneIconResolver = (name: string, set: string) => string | Promise<string>;

const BUILTIN_ICONS: Record<string, string> = {
  'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'chart-bar': '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'wand': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
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

const ICON_ALIASES: Record<string, string> = {
  analytics: 'chart-bar',
  chart: 'chart-bar',
  'bar-chart': 'chart-bar',
  graph: 'chart-bar',
  marketplace: 'shopping-bag',
  store: 'shopping-bag',
  shop: 'shopping-bag',
  bag: 'shopping-bag',
  social: 'message-circle',
  chat: 'message-circle',
  comment: 'message-circle',
  message: 'message-circle',
  ai: 'bot',
  agent: 'bot',
  robot: 'bot',
  copilot: 'bot',
  dna: 'wand',
  magic: 'wand',
  studio: 'wand',
  privacy: 'shield',
  veil: 'shield',
  security: 'shield',
  sound: 'volume-2',
  audio: 'volume-2',
  volume: 'volume-2',
  mute: 'volume-x',
  'sound-off': 'volume-x',
  cart: 'shopping-cart',
  basket: 'shopping-cart',
  repost: 'repeat',
  share: 'repeat',
  retweet: 'repeat',
  like: 'heart',
  love: 'heart',
  favorite: 'bookmark',
  save: 'bookmark',
  close: 'x',
  cancel: 'x',
  find: 'search',
  'magnifying-glass': 'search',
  secret: 'key',
  password: 'key',
  'trending-up': 'trend-up',
  up: 'trend-up',
  'trending-down': 'trend-down',
  down: 'trend-down',
  'sliders-horizontal': 'sliders',
  settings: 'sliders',
  controls: 'sliders',
  lightning: 'zap',
  bolt: 'zap',
  fast: 'zap',
  stream: 'zap',
  bento: 'grid',
  layout: 'grid',
  'badge-check': 'verified',
  'check-circle': 'verified',
  cube: 'box',
  package: 'box',
  gem: 'diamond',
  crystal: 'diamond',
  logo: 'diamond',
  hamburger: 'menu',
  bars: 'menu'
};

const PACK_NAME_MAP: Record<string, Record<string, string>> = {
  lucide: {
    'chart-bar': 'bar-chart-2', 'trend-up': 'trending-up', 'trend-down': 'trending-down',
    wand: 'wand-2', verified: 'badge-check', diamond: 'gem', 'heart-filled': 'heart',
    'star-filled': 'star', 'bookmark-filled': 'bookmark', refresh: 'refresh-cw'
  },
  ph: {
    rocket: 'rocket-launch', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag',
    'message-circle': 'chat-circle', bot: 'robot', wand: 'magic-wand',
    shield: 'shield-check', 'volume-2': 'speaker-high', 'volume-x': 'speaker-slash',
    sparkles: 'sparkle', zap: 'lightning', layers: 'stack', sliders: 'sliders-horizontal',
    grid: 'squares-four', search: 'magnifying-glass', heart: 'heart', 'heart-filled': 'heart-fill',
    star: 'star', 'star-filled': 'star-fill', repeat: 'arrows-clockwise',
    bookmark: 'bookmark-simple', 'bookmark-filled': 'bookmark-simple-fill',
    'shopping-cart': 'shopping-cart', verified: 'seal-check', diamond: 'diamond',
    'trend-up': 'trend-up', 'trend-down': 'trend-down', key: 'key', command: 'command',
    music: 'music-notes', 'eye-off': 'eye-slash', 'chevron-up': 'caret-up', 'chevron-down': 'caret-down'
  },
  tabler: {
    rocket: 'rocket', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag',
    'message-circle': 'message-circle', bot: 'robot', wand: 'wand',
    shield: 'shield', 'volume-2': 'volume', 'volume-x': 'volume-off',
    sparkles: 'sparkles', zap: 'bolt', layers: 'stack-2', sliders: 'adjustments',
    grid: 'layout-grid', search: 'search', heart: 'heart', 'heart-filled': 'heart-filled',
    star: 'star', 'star-filled': 'star-filled', repeat: 'repeat', bookmark: 'bookmark',
    'bookmark-filled': 'bookmark-filled', 'shopping-cart': 'shopping-cart',
    verified: 'rosette-discount-check', diamond: 'diamond', 'trend-up': 'trending-up',
    'trend-down': 'trending-down', key: 'key', command: 'command'
  },
  solar: {
    rocket: 'rocket-2-linear', 'chart-bar': 'chart-square-linear', 'shopping-bag': 'bag-4-linear',
    'message-circle': 'chat-round-dots-linear', bot: 'cpu-bolt-linear', wand: 'magic-stick-3-linear',
    shield: 'shield-check-linear', 'volume-2': 'volume-loud-linear', 'volume-x': 'volume-cross-linear',
    sparkles: 'stars-minimalistic-linear', zap: 'bolt-linear', layers: 'layers-linear',
    sliders: 'tuning-2-linear', grid: 'widget-4-linear', search: 'magnifer-linear',
    heart: 'heart-linear', 'heart-filled': 'heart-bold', star: 'star-linear', 'star-filled': 'star-bold',
    repeat: 'restart-linear', bookmark: 'bookmark-linear', 'bookmark-filled': 'bookmark-bold',
    'shopping-cart': 'cart-large-2-linear', verified: 'verified-check-linear', diamond: 'diamond-linear',
    'trend-up': 'graph-up-linear', 'trend-down': 'graph-down-linear', key: 'key-linear'
  },
  heroicons: {
    rocket: 'rocket-launch', 'chart-bar': 'chart-bar', 'shopping-bag': 'shopping-bag',
    'message-circle': 'chat-bubble-left-right', bot: 'cpu-chip', wand: 'sparkles',
    shield: 'shield-check', 'volume-2': 'speaker-wave', 'volume-x': 'speaker-x-mark',
    sparkles: 'sparkles', zap: 'bolt', layers: 'square-3-stack-3d', sliders: 'adjustments-horizontal',
    grid: 'squares-2x2', search: 'magnifying-glass', heart: 'heart', 'heart-filled': 'heart-solid',
    star: 'star', 'star-filled': 'star-solid', repeat: 'arrow-path', bookmark: 'bookmark',
    'bookmark-filled': 'bookmark-solid', 'shopping-cart': 'shopping-cart',
    verified: 'check-badge', 'trend-up': 'arrow-trending-up', 'trend-down': 'arrow-trending-down'
  }
};

const customIcons = new Map<string, string>();
const remoteSvgCache = new Map<string, string>();
const remoteInflight = new Map<string, Promise<string | null>>();
let customResolver: OzoneIconResolver | null = null;

function sanitizeSvg(svgMarkup: string, size: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
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

async function resolveRemoteSvg(name: string, set: string): Promise<string | null> {
  if (typeof document !== 'undefined' && document.documentElement.dataset.ozGdpr === 'strict') return null;
  const mappedName = PACK_NAME_MAP[set]?.[name] || name;
  const cacheKey = `${set}:${mappedName}`;
  if (remoteSvgCache.has(cacheKey)) return remoteSvgCache.get(cacheKey)!;
  if (remoteInflight.has(cacheKey)) return remoteInflight.get(cacheKey)!;

  const task = (async () => {
    try {
      let raw = '';
      if (customResolver) {
        const res = await customResolver(mappedName, set);
        if (res.trim().startsWith('<svg')) {
          raw = res;
        } else if (res) {
          const r = await fetch(res);
          if (r.ok) raw = await r.text();
        }
      } else {
        const url = `https://api.iconify.design/${encodeURIComponent(set)}/${encodeURIComponent(mappedName)}.svg`;
        const r = await fetch(url);
        if (r.ok) raw = await r.text();
      }
      if (raw && raw.includes('<svg')) {
        remoteSvgCache.set(cacheKey, raw);
        return raw;
      }
    } catch {}
    return null;
  })();

  remoteInflight.set(cacheKey, task);
  const result = await task;
  remoteInflight.delete(cacheKey);
  return result;
}

export const icons = {
  getDefaultSet(): string {
    return document.documentElement.dataset.ozIconSet || 'builtin';
  },
  setDefaultSet(setName: string) {
    document.documentElement.dataset.ozIconSet = setName;
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { set: setName } }));
  },
  register(name: string, svgInnerOrFull: string) {
    customIcons.set(name.toLowerCase().trim(), svgInnerOrFull);
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { registered: name } }));
  },
  registerAliases(map: Record<string, string>) {
    for (const [alias, target] of Object.entries(map)) {
      ICON_ALIASES[alias.toLowerCase().trim()] = target.toLowerCase().trim();
    }
  },
  setResolver(fn: OzoneIconResolver | null) {
    customResolver = fn;
    remoteSvgCache.clear();
    window.dispatchEvent(new CustomEvent('oz-icon-set-change', { detail: { resolverChanged: true } }));
  },
  list(): string[] {
    return Array.from(new Set([...Object.keys(BUILTIN_ICONS), ...customIcons.keys()]));
  }
};

export class OzIcon extends OzoneElement {
  static get observedAttributes() {
    return ['name', 'icon', 'set', 'size', 'stroke', 'fill', 'src', 'icon-class', 'spin', 'glow'];
  }

  private inlineSvgEl: SVGElement | null = null;
  private boundSetListener = false;

  protected render() {
    if (!this.boundSetListener) {
      this.boundSetListener = true;
      window.addEventListener('oz-icon-set-change', () => {
        if (this.isConnected) this.safeRender();
      });
    }

    const sizeRaw = this.prop('size', [], '16');
    const size = /^\d+$/.test(sizeRaw) ? `${sizeRaw}px` : sizeRaw;
    const stroke = this.prop('stroke', [], '1.75');
    const iconClass = this.prop('icon-class', ['class-icon']);
    const src = this.prop('src');

    // Mode 4A: Direct child <svg> slot
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

    // Mode 4B: CSS Icon Font class (FontAwesome, RemixIcon, Material Symbols)
    if (iconClass) {
      this.innerHTML = `<i class="${escapeHTML(iconClass)}" aria-hidden="true" style="font-size:${escapeHTML(size)};line-height:1;"></i>`;
      return;
    }

    // Mode 4C: External SVG URL
    if (src) {
      this.innerHTML = `<img src="${escapeHTML(src)}" alt="" style="width:${escapeHTML(size)};height:${escapeHTML(size)};object-fit:contain;" />`;
      if (src.endsWith('.svg')) {
        fetch(src).then((r) => (r.ok ? r.text() : '')).then((txt) => {
          const clean = txt ? sanitizeSvg(txt, size) : '';
          if (clean && this.isConnected && this.getAttribute('src') === src) {
            this.innerHTML = clean;
          }
        }).catch(() => {});
      }
      return;
    }

    // Resolve name + optional "set:icon" prefix
    let rawName = this.prop('name', ['icon'], 'sparkles').trim().toLowerCase();
    let explicitSet = this.prop('set');
    if (rawName.includes(':')) {
      const [prefix, iconPart] = rawName.split(':', 2);
      explicitSet = explicitSet || prefix;
      rawName = iconPart;
    }

    const canonical = ICON_ALIASES[rawName] || rawName;
    const activeSet = explicitSet || icons.getDefaultSet();

    // Mode 3: Developer-registered custom SVG
    const custom = customIcons.get(rawName) || customIcons.get(canonical);
    if (custom && !explicitSet) {
      if (custom.trim().startsWith('<svg')) {
        const clean = sanitizeSvg(custom, size);
        if (clean) {
          this.innerHTML = clean;
          return;
        }
      } else {
        this.innerHTML = this.wrapPaths(custom, size, stroke);
        return;
      }
    }

    // Mode 1: Instant 0ms Built-In Geometric Vector Dictionary (always renders immediately)
    const builtInPaths = BUILTIN_ICONS[canonical];
    if (builtInPaths) {
      this.innerHTML = this.wrapPaths(builtInPaths, size, stroke);
    } else {
      // Minimal geometric placeholder dot until remote fetch arrives
      this.innerHTML = this.wrapPaths('<circle cx="12" cy="12" r="4"/>', size, stroke);
    }

    // Mode 2: Multi-Pack On-Demand Iconify / Custom Resolver Fetch
    const needsRemote =
      (activeSet !== 'builtin' && activeSet !== 'default') ||
      !builtInPaths ||
      customResolver !== null;

    if (needsRemote && (activeSet !== 'builtin' || !builtInPaths || customResolver !== null)) {
      queueMicrotask(() => {
        if (!this.isConnected) return;
        const lateCustom = customIcons.get(rawName) || customIcons.get(canonical);
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

  private wrapPaths(paths: string, size: string, stroke: string): string {
    return `<svg viewBox="0 0 24 24" width="${escapeHTML(size)}" height="${escapeHTML(size)}" fill="none" stroke="currentColor" stroke-width="${escapeHTML(stroke)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }
}
