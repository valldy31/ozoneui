// ============================================================================
// OzoneUI Layer 4: <oz-renderer> Declarative Streaming JSON-to-UI Engine
// ============================================================================
import { OzoneElement, repairJSON, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';

export interface OzUISchemaNode {
  type: string;
  props?: Record<string, unknown>;
  text?: string;
  action?: { name: string; payload?: unknown };
  children?: Array<OzUISchemaNode | string>;
}

const ALLOWED_HTML_TAGS = new Set(['div', 'span', 'p', 'h2', 'h3', 'h4', 'section', 'header', 'strong', 'em', 'ul', 'li']);

export class OzRenderer extends OzoneElement {
  static get observedAttributes() {
    return ['schema'];
  }

  private _schemaObj: unknown = null;

  set schema(val: unknown) {
    this._schemaObj = val;
    this.safeRender();
  }

  get schema(): unknown {
    return this._schemaObj ?? this.getAttribute('schema');
  }

  protected render() {
    const raw = this._schemaObj ?? this.getAttribute('schema') ?? '';
    if (!String(raw).trim() && !this._schemaObj) {
      this.innerHTML = `<div class="oz-muted oz-text-sm">Waiting for AI JSON UI schema...</div>`;
      return;
    }

    const parsed = repairJSON<OzUISchemaNode | OzUISchemaNode[]>(raw);
    if (!parsed.ok || !parsed.data) {
      this.innerHTML = `
        <div class="oz-badge oz-badge--amber" style="padding:8px 12px;border-radius:10px;">
          <span>Streaming / Parsing Schema: ${escapeHTML(parsed.error || 'Waiting for valid token')}</span>
        </div>
      `;
      return;
    }

    this.innerHTML = '';

    if (parsed.repaired) {
      const strip = document.createElement('div');
      strip.style.marginBottom = '10px';
      strip.innerHTML = `<oz-badge variant="violet" pulse>Self-Healed Streaming JSON</oz-badge>`;
      this.appendChild(strip);
    }

    const rootList = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    for (const node of rootList) {
      const built = this.buildNode(node);
      if (built) this.appendChild(built);
    }
  }

  private buildNode(node: OzUISchemaNode | string): Node | null {
    if (typeof node === 'string') {
      return document.createTextNode(node);
    }
    if (!node || typeof node !== 'object' || !node.type) return null;

    const tag = String(node.type).toLowerCase().trim();
    const isSafeOz = tag.startsWith('oz-') && /^[a-z0-9-]+$/.test(tag);
    if (!isSafeOz && !ALLOWED_HTML_TAGS.has(tag)) {
      const warn = document.createElement('oz-badge');
      warn.setAttribute('variant', 'amber');
      warn.setAttribute('label', `Blocked tag: ${tag}`);
      return warn;
    }

    const el = document.createElement(tag);
    const props = node.props && typeof node.props === 'object' ? node.props : {};

    for (const [key, val] of Object.entries(props)) {
      if (val === undefined || val === null || val === false) continue;
      if (key === 'action' || key === 'onClick') continue;
      if (key === 'style' && typeof val === 'string') {
        el.setAttribute('style', val);
      } else if (typeof val === 'boolean') {
        if (val) el.setAttribute(key, '');
      } else if (typeof val === 'object') {
        el.setAttribute(key, JSON.stringify(val));
      } else {
        el.setAttribute(key, String(val));
      }
    }

    if (node.text && !Array.isArray(node.children)) {
      el.textContent = String(node.text);
    }

    const actionObj = node.action || (props.action as { name?: string; payload?: unknown } | undefined);
    if (actionObj) {
      el.addEventListener('click', () => {
        sound.click();
        const actName = typeof actionObj === 'string' ? actionObj : actionObj.name || 'action';
        const payload = typeof actionObj === 'object' ? actionObj.payload : undefined;
        this.dispatchEvent(new CustomEvent('oz-action', {
          detail: { action: actName, payload, node },
          bubbles: true
        }));
        toast({
          title: `AI Schema Action: ${actName}`,
          message: payload ? JSON.stringify(payload) : 'Dispatched safely from <oz-renderer>',
          variant: 'violet'
        });
      });
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const c = this.buildNode(child);
        if (c) el.appendChild(c);
      }
    }

    return el;
  }
}
