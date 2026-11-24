// ============================================================================
// OzoneUI Pack B: Admin Backends, BI & Telemetry
// <oz-stat>, <oz-chart>, <oz-table>, <oz-smart-view>
// ============================================================================
import { OzoneElement, escapeHTML, repairJSON } from '../core/element.ts';
import { sound } from '../core/sound.ts';
import { toast } from '../core/toast.ts';
import { morph } from '../core/registry.ts';

function parseSeries(raw: string | number[]): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter(Number.isFinite);
  const str = String(raw || '').trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    const parsed = repairJSON<unknown[]>(str);
    if (parsed.ok && Array.isArray(parsed.data)) {
      return parsed.data.map((d) => (typeof d === 'object' && d !== null ? Number((d as Record<string, unknown>).value ?? 0) : Number(d))).filter(Number.isFinite);
    }
  }
  return str.split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
}

// 10. <oz-stat>
export class OzStat extends OzoneElement {
  static get observedAttributes() {
    return ['title', 'label', 'value', 'delta', 'trend', 'sparkline', 'mask', 'src', 'poll'];
  }

  private liveData: Record<string, unknown> | null = null;

  protected onDataLoading() {
    if (!this.liveData && !this.hasAttribute('value')) {
      this.innerHTML = `<div class="oz-shimmer" style="height:98px;"></div>`;
    }
  }

  protected onDataLoaded(payload: unknown) {
    if (payload && typeof payload === 'object') {
      this.liveData = payload as Record<string, unknown>;
      this.safeRender();
    }
  }

  protected render() {
    const title = (this.liveData?.title as string) || this.prop('title', ['label'], 'Metric');
    const value = (this.liveData?.value as string) || this.prop('value', [], '0');
    const delta = (this.liveData?.delta as string) || this.prop('delta');
    const trend = this.prop('trend', [], delta?.startsWith('-') ? 'down' : delta ? 'up' : 'neutral');
    const sparkRaw = (this.liveData?.data as number[]) || this.prop('sparkline');
    const pts = parseSeries(sparkRaw);

    const sparkSvg = pts.length > 1 ? this.buildSparkline(pts, trend) : '';
    const iconName = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'minus';

    this.innerHTML = `
      <div class="oz-stat__top">
        <span class="oz-stat__title">${escapeHTML(title)}</span>
        ${delta ? `<span class="oz-stat__delta oz-stat__delta--${escapeHTML(trend)}"><oz-icon name="${iconName}" size="12"></oz-icon> ${escapeHTML(delta)}</span>` : ''}
      </div>
      <div class="oz-stat__main">
        <div class="oz-stat__value oz-mask-target">${escapeHTML(value)}</div>
        ${sparkSvg}
      </div>
    `;
  }

  private buildSparkline(pts: number[], trend: string): string {
    const w = 104;
    const h = 36;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 4 - ((v - min) / span) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const stroke = trend === 'down' ? 'var(--oz-rose)' : trend === 'up' ? 'var(--oz-emerald)' : 'var(--oz-primary)';
    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:88px;max-width:100%;height:34px;overflow:visible;flex-shrink:1;">
        <polyline fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${coords.join(' ')}" />
      </svg>
    `;
  }
}

// 11. <oz-chart>
export class OzChart extends OzoneElement {
  static get observedAttributes() {
    return ['type', 'title', 'subtitle', 'labels', 'data', 'glow', 'exportable', 'src', 'poll'];
  }

  private livePayload: { labels?: string[]; data?: number[] } | null = null;
  private activeType: string | null = null;
  private ro: ResizeObserver | null = null;
  private lastW = 0;
  private rt = 0;

  protected onDataLoading() {
    if (!this.livePayload && !this.hasAttribute('data')) {
      this.innerHTML = `<div class="oz-shimmer" style="height:260px;"></div>`;
    }
  }

  protected onDataLoaded(payload: unknown) {
    if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      if (Array.isArray(p.data)) {
        this.livePayload = {
          labels: Array.isArray(p.labels) ? p.labels.map(String) : undefined,
          data: p.data.map(Number)
        };
        this.safeRender();
      }
    }
  }

  protected render() {
    const type = this.activeType || this.prop('type', ['kind'], 'area');
    const title = this.prop('title', ['label'], 'Analytics Overview');
    const subtitle = this.prop('subtitle');
    const exportable = this.boolProp('exportable');
    const glow = this.prop('glow', ['color'], 'cyan');

    const rawData = this.livePayload?.data || this.prop('data', [], '120,185,160,245,310,295,410');
    const values = parseSeries(rawData);
    const rawLabels = this.livePayload?.labels || this.prop('labels', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    const labels = values.map((_, i) => rawLabels[i] || `P${i + 1}`);

    const accentMap: Record<string, string> = {
      cyan: 'var(--oz-cyan)',
      violet: 'var(--oz-violet)',
      emerald: 'var(--oz-emerald)',
      amber: 'var(--oz-amber)',
      rose: 'var(--oz-rose)'
    };
    const strokeColor = accentMap[glow] || 'var(--oz-primary)';

    this.innerHTML = `
      <div class="oz-chart__head">
        <div>
          <div class="oz-chart__title">${escapeHTML(title)}</div>
          ${subtitle ? `<div class="oz-chart__subtitle">${escapeHTML(subtitle)}</div>` : ''}
        </div>
        <div class="oz-chart__controls">
          ${['area', 'bar', 'line', 'donut'].map((t) => `
            <button type="button" class="oz-btn oz-btn--sm ${type === t ? 'oz-btn--primary' : 'oz-btn--ghost'}" data-chart-type="${t}" style="padding:4px 9px;font-size:0.72rem;text-transform:capitalize;">${t}</button>
          `).join('')}
          ${exportable ? `<button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-export-svg style="padding:4px 9px;font-size:0.72rem;">SVG</button>` : ''}
        </div>
      </div>
      <div class="oz-chart__canvas">
        <div class="oz-chart__tooltip"></div>
        ${this.renderSvg(type, values, labels, strokeColor)}
      </div>
    `;

    this.querySelectorAll('[data-chart-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.click();
        this.activeType = (btn as HTMLElement).dataset.chartType || 'area';
        this.safeRender();
      });
    });

    this.querySelector('[data-export-svg]')?.addEventListener('click', () => {
      const svg = this.querySelector('svg');
      if (!svg) return;
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      sound.success();
      toast({ title: 'SVG Exported', message: `Downloaded vector chart for "${title}".`, variant: 'emerald' });
    });

    // Interactive hover tooltip
    const tooltip = this.querySelector('.oz-chart__tooltip') as HTMLElement;
    const canvas = this.querySelector('.oz-chart__canvas') as HTMLElement;
    this.querySelectorAll('[data-tip]').forEach((el) => {
      const positionTip = (evt: PointerEvent, target: SVGElement) => {
        if (!tooltip || !canvas) return;
        tooltip.textContent = target.getAttribute('data-tip') || '';
        const cr = canvas.getBoundingClientRect();
        if (type === 'donut') {
          tooltip.style.left = `${evt.clientX - cr.left}px`;
          tooltip.style.top = `${evt.clientY - cr.top - 8}px`;
        } else {
          const tr = target.getBoundingClientRect();
          tooltip.style.left = `${tr.left - cr.left + tr.width / 2}px`;
          tooltip.style.top = `${tr.top - cr.top}px`;
        }
        tooltip.style.opacity = '1';
      };
      el.addEventListener('pointerenter', (e) => positionTip(e as PointerEvent, e.currentTarget as SVGElement));
      if (type === 'donut') {
        el.addEventListener('pointermove', (e) => positionTip(e as PointerEvent, e.currentTarget as SVGElement));
      }
      el.addEventListener('pointerleave', () => {
        if (tooltip) tooltip.style.opacity = '0';
      });
    });
    this.lastW = this.clientWidth;
    if (!this.ro && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        if (!this.isConnected) { this.ro?.disconnect(); this.ro = null; return; }
        const cw = this.clientWidth;
        if (Math.abs(cw - this.lastW) > 16) {
          this.lastW = cw;
          window.clearTimeout(this.rt);
          this.rt = window.setTimeout(() => this.safeRender(), 120);
        }
      });
      this.ro.observe(this);
    }
  }

  private renderSvg(type: string, values: number[], labels: string[], color: string): string {
    if (values.length === 0) return '<div class="oz-muted oz-text-sm">No chart data</div>';
    const uid = Math.random().toString(36).slice(2, 8);

    if (type === 'donut') {
      const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const palette = ['var(--oz-cyan)', 'var(--oz-violet)', 'var(--oz-emerald)', 'var(--oz-amber)', 'var(--oz-rose)', 'var(--oz-primary)'];
      const r = 68;
      const cx = 100;
      const cy = 100;
      const circ = 2 * Math.PI * r;
      let offset = 0;
      const arcs = values.map((v, i) => {
        const frac = Math.max(0, v) / total;
        const dash = frac * circ;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette[i % palette.length]}" stroke-width="24" stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" data-tip="${escapeHTML(labels[i])}: ${v.toLocaleString()} (${Math.round(frac * 100)}%)" style="cursor:pointer;transition:opacity 160ms;" />`;
        offset += dash;
        return seg;
      }).join('');

      const legend = values.map((v, i) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;">
          <span style="width:10px;height:10px;border-radius:3px;background:${palette[i % palette.length]};flex-shrink:0;"></span>
          <span class="oz-muted">${escapeHTML(labels[i])}</span>
          <strong style="margin-left:auto;">${v.toLocaleString()}</strong>
        </div>
      `).join('');

      return `
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-around;gap:18px;">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--oz-border)" stroke-width="24" />
            ${arcs}
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--oz-text)" font-size="20" font-weight="700">${total.toLocaleString()}</text>
            <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--oz-text-muted)" font-size="11">TOTAL</text>
          </svg>
          <div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:8px;">${legend}</div>
        </div>
      `;
    }

    const cs = getComputedStyle(this);
    const innerW = this.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const w = Math.max(240, Math.round(innerW || 600));
    const compact = w < 460;
    const h = compact ? 230 : Math.round(Math.min(340, Math.max(250, w * 0.3)));
    const padL = 46, padR = compact ? 14 : 20, padY = 20, padBottom = 34, inset = 12;
    const plotW = w - padL - padR, plotH = h - padY - padBottom;
    const max = Math.max(...values) * 1.12 || 10, min = type === 'bar' ? 0 : Math.min(0, ...values), span = max - min || 1;
    const fmt = (n: number) => { const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : a >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(n)); };
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => { const y = (padY + plotH * (1 - t)).toFixed(1); return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--oz-border)" stroke-dasharray="3 4" /><text x="${padL - 10}" y="${(Number(y) + 4).toFixed(1)}" text-anchor="end" fill="var(--oz-text-subtle)" font-size="12">${fmt(min + span * t)}</text>`; }).join('');
    const step = Math.max(1, Math.ceil(values.length / Math.max(2, Math.floor(plotW / 56))));
    const svgOpen = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="display:block;width:100%;height:${h}px;overflow:visible;">`;
    if (type === 'bar') {
      const slotW = plotW / values.length, barW = Math.min(48, Math.max(8, slotW * 0.56));
      const bars = values.map((v, i) => {
        const barH = Math.max(4, ((v - min) / span) * plotH);
        const x = padL + i * slotW + (slotW - barW) / 2, y = padY + plotH - barH;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="6" fill="url(#oz-grad-${uid})" data-tip="${escapeHTML(labels[i])}: ${v.toLocaleString()}" style="cursor:pointer;" />`;
      }).join('');
      const barLabels = labels.map((l, i) => i % step ? '' : `<text x="${(padL + i * slotW + slotW / 2).toFixed(1)}" y="${h - 10}" text-anchor="middle" fill="var(--oz-text-subtle)" font-size="12">${escapeHTML(l)}</text>`).join('');
      return `${svgOpen}<defs><linearGradient id="oz-grad-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.95" /><stop offset="100%" stop-color="${color}" stop-opacity="0.28" /></linearGradient></defs>${gridLines}${bars}${barLabels}</svg>`;
    }
    const px = (i: number) => values.length === 1 ? padL + plotW / 2 : padL + inset + (i / (values.length - 1)) * (plotW - inset * 2);
    const pts = values.map((v, i) => ({ x: px(i), y: padY + plotH - ((v - min) / span) * plotH, v, label: labels[i] }));
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padY + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;
    const xLabels = labels.map((l, i) => i % step ? '' : `<text x="${px(i).toFixed(1)}" y="${h - 10}" text-anchor="middle" fill="var(--oz-text-subtle)" font-size="12">${escapeHTML(l)}</text>`).join('');
    const r = compact ? 4 : 5;
    return `${svgOpen}<defs><linearGradient id="oz-area-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.38" /><stop offset="100%" stop-color="${color}" stop-opacity="0.01" /></linearGradient></defs>${gridLines}${type === 'area' ? `<path d="${areaPath}" fill="url(#oz-area-${uid})" />` : ''}<path d="${linePath}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 4px 10px ${color});" />${pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="var(--oz-bg-elevated)" stroke="${color}" stroke-width="2.5" data-tip="${escapeHTML(p.label)}: ${p.v.toLocaleString()}" style="cursor:pointer;" />`).join('')}${xLabels}</svg>`;
  }
}

// 12. <oz-table>
export class OzTable extends OzoneElement {
  static get observedAttributes() {
    return ['title', 'rows', 'data', 'searchable', 'exportable', 'mask-cols', 'src', 'poll'];
  }

  private sortKey = '';
  private sortAsc = true;
  private query = '';
  private loadedRows: Array<Record<string, unknown>> | null = null;

  protected onDataLoading() {
    if (!this.loadedRows && !this.hasAttribute('rows') && !this.hasAttribute('data')) {
      this.innerHTML = `<div class="oz-shimmer" style="height:220px;"></div>`;
    }
  }

  protected onDataLoaded(payload: unknown) {
    if (Array.isArray(payload)) {
      this.loadedRows = payload as Array<Record<string, unknown>>;
      this.safeRender();
    }
  }

  protected render() {
    const title = this.prop('title', ['label'], 'Data Records');
    const searchable = this.boolProp('searchable');
    const exportable = this.boolProp('exportable');
    const maskCols = new Set(this.prop('mask-cols', ['mask'], '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));

    const rows = this.loadedRows || this.jsonProp<Array<Record<string, unknown>>>('rows', ['data'], []);
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

    let filtered = rows.filter((r) => {
      if (!this.query) return true;
      const q = this.query.toLowerCase();
      return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
    });

    if (this.sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const va = String(a[this.sortKey] ?? '');
        const vb = String(b[this.sortKey] ?? '');
        const na = Number(va.replace(/[^0-9.-]/g, ''));
        const nb = Number(vb.replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(na) && !Number.isNaN(nb) && va.match(/[\d]/) && vb.match(/[\d]/)) {
          return this.sortAsc ? na - nb : nb - na;
        }
        return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    this.innerHTML = `
      <div class="oz-table__toolbar">
        <div>
          <div class="oz-card__title">${escapeHTML(title)}</div>
          <div class="oz-text-xs oz-muted">${filtered.length} of ${rows.length} entries</div>
        </div>
        <div class="oz-row" style="gap:8px;">
          ${searchable ? `<input class="oz-input-field" data-oz-table-search placeholder="Filter records..." value="${escapeHTML(this.query)}" style="background:var(--oz-surface-inset);border:1px solid var(--oz-border);border-radius:var(--oz-radius-sm);padding:6px 11px;font-size:0.82rem;width:190px;" />` : ''}
          ${exportable ? `
            <button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-oz-csv>Export CSV</button>
            <button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-oz-json>JSON</button>
          ` : ''}
        </div>
      </div>
      <div class="oz-table__scroll">
        <table class="oz-table__el">
          <thead>
            <tr>
              ${cols.map((c) => `
                <th data-sort-col="${escapeHTML(c)}">
                  <span style="display:inline-flex;align-items:center;gap:4px;">${escapeHTML(c)} ${this.sortKey === c ? `<oz-icon name="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" size="12"></oz-icon>` : ''}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="${Math.max(1, cols.length)}" class="oz-muted">No matching records</td></tr>` : filtered.map((row) => `
              <tr>
                ${cols.map((c) => this.renderCell(c, row[c], maskCols.has(c.toLowerCase()))).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const searchInput = this.querySelector('[data-oz-table-search]') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const pos = searchInput.selectionStart || 0;
        this.query = searchInput.value;
        this.safeRender();
        const nextInp = this.querySelector('[data-oz-table-search]') as HTMLInputElement | null;
        if (nextInp) {
          nextInp.focus();
          nextInp.setSelectionRange(pos, pos);
        }
      });
    }

    this.querySelectorAll('th[data-sort-col]').forEach((th) => {
      th.addEventListener('click', () => {
        const col = (th as HTMLElement).dataset.sortCol || '';
        if (this.sortKey === col) this.sortAsc = !this.sortAsc;
        else {
          this.sortKey = col;
          this.sortAsc = true;
        }
        sound.click();
        this.safeRender();
      });
    });

    this.querySelector('[data-oz-csv]')?.addEventListener('click', () => {
      const header = cols.join(',');
      const body = filtered.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      this.downloadFile(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, `${header}\n${body}`, 'text/csv');
      toast({ title: 'CSV Exported', message: `Exported ${filtered.length} rows to CSV.`, variant: 'emerald' });
    });

    this.querySelector('[data-oz-json]')?.addEventListener('click', () => {
      this.downloadFile(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`, JSON.stringify(filtered, null, 2), 'application/json');
      toast({ title: 'JSON Exported', message: `Exported ${filtered.length} rows to JSON.`, variant: 'cyan' });
    });
  }

  private renderCell(col: string, val: unknown, masked: boolean): string {
    const str = String(val ?? '');
    if (col.toLowerCase() === 'status') {
      const low = str.toLowerCase();
      const variant = /active|live|paid|success|online/.test(low)
        ? 'emerald'
        : /trial|pending|warn/.test(low)
          ? 'amber'
          : /fail|error|suspend/.test(low)
            ? 'rose'
            : 'cyan';
      return `<td data-mask="${masked}"><span class="oz-badge oz-badge--${variant}">${escapeHTML(str)}</span></td>`;
    }
    return `<td data-mask="${masked}"><span>${escapeHTML(str)}</span></td>`;
  }

  private downloadFile(name: string, content: string, mime: string) {
    sound.success();
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 13. <oz-smart-view> (Zero-Config 4-Way Data Morphing)
export class OzSmartView extends OzoneElement {
  static get observedAttributes() {
    return ['title', 'data', 'view', 'src', 'poll'];
  }

  private currentView: 'table' | 'chart' | 'cards' | 'json' = 'table';
  private fetchedRows: Array<Record<string, unknown>> | null = null;

  protected onDataLoaded(payload: unknown) {
    if (Array.isArray(payload)) {
      this.fetchedRows = payload as Array<Record<string, unknown>>;
      this.safeRender();
    }
  }

  protected render() {
    const title = this.prop('title', [], 'Smart Data Morpher');
    const viewAttr = this.prop('view') as 'table' | 'chart' | 'cards' | 'json';
    if (viewAttr && !this._mounted) this.currentView = viewAttr;
    this._mounted = true;

    const rows = this.fetchedRows || this.jsonProp<Array<Record<string, unknown>>>('data', ['rows'], []);

    this.innerHTML = `
      <div class="oz-between" style="margin-bottom:14px;">
        <div>
          <div class="oz-card__title">${escapeHTML(title)}</div>
          <div class="oz-text-xs oz-muted">Auto-morphing JSON schema across 4 live views</div>
        </div>
        <div class="oz-row" style="gap:6px;">
          ${(['table', 'chart', 'cards', 'json'] as const).map((v) => `
            <button type="button" class="oz-btn oz-btn--sm ${this.currentView === v ? 'oz-btn--glow' : 'oz-btn--glass'}" data-view="${v}" style="text-transform:capitalize;">${v}</button>
          `).join('')}
        </div>
      </div>
      <div class="oz-smart-stage"></div>
    `;

    const stage = this.querySelector('.oz-smart-stage') as HTMLElement;

    if (this.currentView === 'table') {
      const tbl = document.createElement('oz-table');
      tbl.setAttribute('title', `${title} — Grid`);
      tbl.setAttribute('searchable', '');
      tbl.setAttribute('exportable', '');
      tbl.setAttribute('rows', JSON.stringify(rows));
      tbl.style.border = 'none';
      tbl.style.padding = '0';
      tbl.style.boxShadow = 'none';
      tbl.style.background = 'transparent';
      stage.appendChild(tbl);
    } else if (this.currentView === 'chart') {
      const keys = rows[0] ? Object.keys(rows[0]) : [];
      const labelKey = keys.find((k) => typeof rows[0][k] === 'string') || keys[0];
      const numKey = keys.find((k) => {
        const val = rows[0][k];
        return typeof val === 'number' || (typeof val === 'string' && /^\$?[\d,.]+$/.test(val.trim()));
      }) || keys[1];

      const labels = rows.map((r) => String(r[labelKey] ?? '')).join(',');
      const nums = rows.map((r) => Number(String(r[numKey] ?? 0).replace(/[^0-9.-]/g, '')) || 0).join(',');

      const chart = document.createElement('oz-chart');
      chart.setAttribute('type', 'bar');
      chart.setAttribute('title', `${title} — ${numKey || 'Metrics'}`);
      chart.setAttribute('labels', labels);
      chart.setAttribute('data', nums);
      chart.setAttribute('glow', 'violet');
      chart.setAttribute('exportable', '');
      chart.style.border = 'none';
      chart.style.padding = '0';
      chart.style.boxShadow = 'none';
      chart.style.background = 'transparent';
      stage.appendChild(chart);
    } else if (this.currentView === 'cards') {
      const grid = document.createElement('div');
      grid.className = 'oz-grid-3';
      rows.forEach((row) => {
        const entries = Object.entries(row);
        const heading = String(entries[1]?.[1] ?? entries[0]?.[1] ?? 'Record');
        const sub = String(entries[0]?.[1] ?? '');
        const card = document.createElement('oz-card');
        card.setAttribute('title', heading);
        card.setAttribute('subtitle', sub);
        card.setAttribute('tilt', '');
        card.innerHTML = entries.slice(2).map(([k, v]) => `
          <div class="oz-between oz-text-sm" style="padding:4px 0;border-bottom:1px solid var(--oz-border);">
            <span class="oz-muted" style="text-transform:capitalize;">${escapeHTML(k)}</span>
            <strong>${escapeHTML(String(v))}</strong>
          </div>
        `).join('');
        grid.appendChild(card);
      });
      stage.appendChild(grid);
    } else {
      const pre = document.createElement('pre');
      pre.style.cssText = 'margin:0;padding:14px;border-radius:var(--oz-radius-sm);background:var(--oz-surface-inset);border:1px solid var(--oz-border);overflow:auto;font-size:0.8rem;max-height:300px;';
      pre.textContent = JSON.stringify(rows, null, 2);
      stage.appendChild(pre);
    }

    this.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextView = (btn as HTMLElement).dataset.view as 'table' | 'chart' | 'cards' | 'json';
        if (nextView && nextView !== this.currentView) {
          sound.click();
          morph(() => {
            this.currentView = nextView;
            this.safeRender();
          });
        }
      });
    });
  }
}
