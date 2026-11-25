// ============================================================================
// OzoneUI Lightweight i18n Dictionary & Safe URL Sanitizer
// ============================================================================

export type OzoneI18nDict = Record<string, string>;

const DEFAULT_DICT: OzoneI18nDict = {
  add: 'Add',
  inspect: 'Inspect',
  by: 'by',
  addedToCart: 'Added to Cart',
  addedToCartMsg: '{title} ({price}) added.',
  notifyMe: 'Notify Me',
  notifyTitle: 'Notification Requested',
  notifyMsg: 'We will notify you when {title} is back.',
  soldOut: 'Sold Out',
  wishlist: 'Wishlist',
  creator: 'Creator',
  save: 'Save',
  saved: 'Saved',
  reposted: 'Reposted',
  repostedMsg: "Shared {handle}'s post.",
  threadOpen: 'Thread Open',
  threadOpenMsg: "Viewing {comments} replies on {handle}'s post.",
  publishPost: 'Publish Post',
  emptyPost: 'Empty Post',
  emptyPostMsg: 'Write something before publishing.',
  publishedLive: 'Published Live',
  publishedLiveMsg: 'Your post is now live on the network.',
  today: 'Today',
  noResults: 'No results',
  searchPlaceholder: 'Search...'
};

const BUILTIN_LOCALES: Record<string, OzoneI18nDict> = {
  en: { ...DEFAULT_DICT },
  bg: {
    add: 'Поръчай',
    inspect: 'Детайли',
    by: 'от',
    addedToCart: 'Добавено в количката',
    addedToCartMsg: '{title} ({price}) е добавен.',
    notifyMe: 'Извести ме',
    notifyTitle: 'Заявено известие',
    notifyMsg: 'Ще ви уведомим, когато {title} отново е наличен.',
    soldOut: 'Изчерпано',
    wishlist: 'Любими',
    creator: 'Автор',
    save: 'Запази',
    saved: 'Запазено',
    reposted: 'Споделено',
    repostedMsg: 'Споделихте публикацията на {handle}.',
    threadOpen: 'Коментари',
    threadOpenMsg: 'Преглед на {comments} коментара за {handle}.',
    publishPost: 'Публикувай',
    emptyPost: 'Празна публикация',
    emptyPostMsg: 'Напишете текст преди публикуване.',
    publishedLive: 'Публикувано',
    publishedLiveMsg: 'Публикацията ви е вече видима.',
    today: 'Днес',
    noResults: 'Няма резултати',
    searchPlaceholder: 'Търсене...'
  }
};

let currentLocale = '';
let activeDict: OzoneI18nDict = { ...DEFAULT_DICT };

function dispatchI18nChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oz-i18n-change', { detail: { locale: i18n.getLocale() } }));
  }
}

export const i18n = {
  get dict(): OzoneI18nDict {
    return { ...activeDict };
  },
  getLocale(): string {
    if (currentLocale) return currentLocale;
    if (typeof document !== 'undefined' && document.documentElement.lang) {
      return document.documentElement.lang;
    }
    return 'en-US';
  },
  t(key: string, vars?: Record<string, string | number>): string {
    const tpl = activeDict[key] ?? DEFAULT_DICT[key] ?? key;
    if (!vars) return tpl;
    return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : ''));
  },
  setLocale(locale: string, overrides?: OzoneI18nDict): OzoneI18nDict {
    currentLocale = String(locale || '').trim() || 'en';
    const baseKey = currentLocale.toLowerCase().split('-')[0];
    const preset = BUILTIN_LOCALES[currentLocale.toLowerCase()] || BUILTIN_LOCALES[baseKey] || {};
    activeDict = { ...DEFAULT_DICT, ...preset, ...(overrides || {}) };
    dispatchI18nChange();
    return this.dict;
  },
  extend(overrides: OzoneI18nDict): OzoneI18nDict {
    activeDict = { ...activeDict, ...(overrides || {}) };
    dispatchI18nChange();
    return this.dict;
  },
  reset(): OzoneI18nDict {
    currentLocale = '';
    activeDict = { ...DEFAULT_DICT };
    dispatchI18nChange();
    return this.dict;
  }
};

/** Blocks javascript:, vbscript:, and scriptable data URIs while keeping relative, https, mailto, tel, viber links safe. */
export function safeHref(url: unknown): string {
  const s = String(url ?? '').trim();
  if (!s) return '#';
  const compact = s.replace(/[\u0000-\u0020]+/g, '');
  if (/^(javascript|vbscript):/i.test(compact) || /^data:[^,]*(html|script|svg)/i.test(compact)) {
    return '#';
  }
  return s;
}
