// ============================================================================
// OzoneUI Hallucination-Proof Base Element, Self-Healing JSON & Live Fetch
// ============================================================================

export function escapeHTML(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Self-healing JSON parser: strips markdown code fences, repairs trailing commas,
 * and auto-closes truncated brackets/quotes during streaming LLM UI generation.
 */
export function repairJSON<T = unknown>(raw: unknown): { ok: boolean; data: T | null; repaired: boolean; error?: string } {
  if (raw !== null && typeof raw === 'object') {
    return { ok: true, data: raw as T, repaired: false };
  }
  const text = String(raw ?? '').trim();
  if (!text) return { ok: false, data: null, repaired: false, error: 'Empty input' };

  const unfenced = text
    .replace(/^```(?:json|JSON)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return { ok: true, data: JSON.parse(unfenced) as T, repaired: unfenced !== text };
  } catch {
    // Attempt automated repair for streaming or slightly malformed LLM JSON
    let candidate = unfenced
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*?)'(\s*[,}\]])/g, ':"$1"$2');

    // Remove trailing dangling comma or colon before closing
    candidate = candidate.replace(/[,:]\s*$/, '');

    // Balance open strings and brackets
    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if ((ch === '}' || ch === ']') && stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }

    if (inString) candidate += '"';
    candidate = candidate.replace(/,\s*$/, '');
    while (stack.length > 0) {
      candidate += stack.pop();
    }
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');

    try {
      return { ok: true, data: JSON.parse(candidate) as T, repaired: true };
    } catch (err) {
      return { ok: false, data: null, repaired: false, error: (err as Error).message };
    }
  }
}

/** Built-in zero-backend mock endpoints for offline demos & rapid prototyping */
export function resolveMockData(src: string): unknown {
  const key = src.replace(/^mock:\/\//i, '').toLowerCase();
  const jitter = (n: number) => Math.max(10, Math.round(n + (Math.random() - 0.45) * (n * 0.14)));

  if (key.includes('revenue') || key.includes('metrics') || key.includes('traffic')) {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [142, 198, 176, 264, 318, 389, 442].map(jitter),
      title: 'Live Neural Telemetry',
      value: `$${jitter(128400).toLocaleString()}`,
      delta: `+${(24 + Math.random() * 12).toFixed(1)}%`
    };
  }

  if (key.includes('user')) {
    return [
      { id: 'USR-901', name: 'Elena Vance', email: 'elena@aether.ai', role: 'Architect', status: 'Active', mrr: '$4,800' },
      { id: 'USR-902', name: 'Marcus Chen', email: 'm.chen@hyperion.io', role: 'Founder', status: 'Active', mrr: '$12,400' },
      { id: 'USR-903', name: 'Aria Solis', email: 'aria@solislabs.dev', role: 'ML Lead', status: 'Trial', mrr: '$980' },
      { id: 'USR-904', name: 'Devon Brooks', email: 'devon@nexus.cloud', role: 'VP Eng', status: 'Active', mrr: '$8,200' },
      { id: 'USR-905', name: 'Sora Takahashi', email: 'sora@kuro.jp', role: 'Design Lead', status: 'Pending', mrr: '$1,450' }
    ];
  }

  if (key.includes('product')) {
    return [
      { title: 'Aether Shader Kit', category: 'Shaders', price: '$69', rating: 4.9, sales: 1420 },
      { title: 'Neural Admin Pro', category: 'Templates', price: '$119', rating: 4.8, sales: 980 },
      { title: 'Spatial Icon Pack 3D', category: 'Assets', price: '$49', rating: 5.0, sales: 2150 },
      { title: 'Voice Agent SDK', category: 'AI Tools', price: '$149', rating: 4.9, sales: 640 }
    ];
  }

  return { labels: ['Q1', 'Q2', 'Q3', 'Q4'], data: [45, 78, 112, 164].map(jitter) };
}

export abstract class OzoneElement extends HTMLElement {
  protected _mounted = false;
  protected _pollTimer: number | null = null;
  protected _slotNodes: ChildNode[] | null = null;

  connectedCallback() {
    this.safeRender();
    this.setupLiveFetch();
  }

  disconnectedCallback() {
    if (this._pollTimer !== null) {
      window.clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    if (oldVal === newVal) return;
    if (this.isConnected) {
      this.safeRender();
      if (name === 'src' || name === 'poll') {
        this.setupLiveFetch();
      }
    }
  }

  /** Hallucination-Proof Attribute Aliasing */
  protected prop(primary: string, aliases: string[] = [], fallback = ''): string {
    const keys = [primary, ...aliases];
    for (const k of keys) {
      if (this.hasAttribute(k)) {
        const val = this.getAttribute(k);
        if (val !== null && val !== '') return val;
      }
    }
    return fallback;
  }

  protected boolProp(primary: string, aliases: string[] = []): boolean {
    const keys = [primary, ...aliases];
    for (const k of keys) {
      if (this.hasAttribute(k)) {
        const val = (this.getAttribute(k) || '').toLowerCase();
        return val !== 'false' && val !== '0';
      }
    }
    return false;
  }

  protected numProp(primary: string, aliases: string[] = [], fallback = 0): number {
    const raw = this.prop(primary, aliases, '');
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  protected jsonProp<T = unknown>(primary: string, aliases: string[] = [], fallback: T): T {
    const raw = this.prop(primary, aliases, '');
    if (!raw) return fallback;
    const parsed = repairJSON<T>(raw);
    return parsed.ok && parsed.data !== null ? parsed.data : fallback;
  }

  /** Captures initial child nodes once so container components never lose slotted HTML */
  protected captureSlotNodes(): ChildNode[] {
    if (this._slotNodes === null) {
      this._slotNodes = Array.from(this.childNodes);
    }
    return this._slotNodes;
  }

  /** Declarative `src=""` & `poll=""` Live Data Wiring */
  protected setupLiveFetch() {
    if (this._pollTimer !== null) {
      window.clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    const src = this.getAttribute('src');
    if (!src) return;

    const runFetch = async () => {
      this.onDataLoading?.();
      try {
        let payload: unknown;
        if (src.startsWith('mock://')) {
          await new Promise((r) => setTimeout(r, 380));
          payload = resolveMockData(src);
        } else {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          payload = await res.json();
        }
        this.onDataLoaded?.(payload);
      } catch (err) {
        this.onDataError?.(err as Error);
      }
    };

    runFetch();

    const pollAttr = this.getAttribute('poll');
    if (pollAttr) {
      const ms = pollAttr.endsWith('ms')
        ? parseInt(pollAttr, 10)
        : pollAttr.endsWith('s')
          ? parseFloat(pollAttr) * 1000
          : parseInt(pollAttr, 10) * 1000;
      if (Number.isFinite(ms) && ms >= 1000) {
        this._pollTimer = window.setInterval(runFetch, ms);
      }
    }
  }

  protected onDataLoading?(): void;
  protected onDataLoaded?(data: unknown): void;
  protected onDataError?(err: Error): void;

  /** Self-healing boundary around component rendering */
  protected safeRender() {
    try {
      this.render();
    } catch (err) {
      this.innerHTML = `
        <div class="oz-badge oz-badge--rose" style="padding:8px 12px;border-radius:10px;">
          <span>Self-Healed &lt;${this.tagName.toLowerCase()}&gt;: ${escapeHTML((err as Error).message)}</span>
        </div>
      `;
    }
  }

  protected abstract render(): void;
}
