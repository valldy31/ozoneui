// @ts-nocheck
// Pack E: mirrored 1:1 in dist/ozone.js
import { OzoneElement, escapeHTML } from '../core/element.ts';
import { sound } from '../core/sound.ts';

// ============================================================================
// OzoneUI Pack E: App Shell, Sidebar & Form Controls
// <oz-sidebar>, <oz-app-shell>, <oz-select>, <oz-checkbox>, <oz-radio-group>,
// <oz-textarea>, <oz-slider>, <oz-date-picker>, <oz-file-upload>, <oz-combobox>
// ============================================================================

const OZ_SVG = {
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  panel: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>',
  burger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

function ozUid() { return Math.random().toString(36).slice(2, 8); }

function ozFieldHTML(host, inner, forId) {
  const label = host.prop('label', ['title']);
  const hint = host.prop('hint', ['help', 'description']);
  const error = host.prop('error');
  const cls = 'oz-field' + (error ? ' oz-field--error' : '') + (host.boolProp('disabled') ? ' oz-field--disabled' : '');
  const lab = label ? `<label class="oz-field__label"${forId ? ` for="${forId}"` : ''}>${escapeHTML(label)}${host.boolProp('required') ? '<span class="oz-field__req">*</span>' : ''}</label>` : '';
  const msg = error ? `<div class="oz-field__msg oz-field__msg--error">${escapeHTML(error)}</div>` : hint ? `<div class="oz-field__msg">${escapeHTML(hint)}</div>` : '';
  return `<div class="${cls}">${lab}${inner}${msg}</div>`;
}

function ozParseOptions(host) {
  const out = [];
  const raw = host.getAttribute('options');
  if (raw) {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        JSON.parse(t).forEach((o) => {
          if (o && typeof o === 'object') out.push({ value: String(o.value ?? o.label), label: String(o.label ?? o.value), desc: o.desc || o.description || '', group: o.group || '' });
          else out.push({ value: String(o), label: String(o), desc: '', group: '' });
        });
      } catch (e) { /* ignore malformed options */ }
    } else {
      t.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => out.push({ value: s, label: s, desc: '', group: '' }));
    }
  }
  host.captureSlotNodes().forEach((n) => {
    if (n.nodeType === 1 && n.tagName === 'OPTION') {
      out.push({ value: n.getAttribute('value') ?? n.textContent.trim(), label: n.textContent.trim(), desc: n.getAttribute('data-desc') || '', group: n.getAttribute('data-group') || '' });
    }
  });
  return out;
}

class OzFormElement extends OzoneElement {
  attributeChangedCallback(name, oldVal, newVal) {
    if (this._silent) return;
    super.attributeChangedCallback(name, oldVal, newVal);
  }
  /** Reflect state to an attribute without triggering a re-render */
  silentSet(name, val) {
    this._silent = true;
    if (val === null || val === false) this.removeAttribute(name);
    else this.setAttribute(name, val === true ? '' : String(val));
    this._silent = false;
  }
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })); }
}

// 32. <oz-select>
export class OzSelect extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'options', 'placeholder']; }
  get value() { const s = this.querySelector('select'); return s ? s.value : this.getAttribute('value') || ''; }
  set value(v) { const s = this.querySelector('select'); if (s) s.value = v; this.silentSet('value', v); }
  render() {
    const opts = ozParseOptions(this);
    const value = this.prop('value', [], '');
    const placeholder = this.prop('placeholder');
    const id = this._id || (this._id = 'oz-sel-' + ozUid());
    const groups = {};
    opts.forEach((o) => { (groups[o.group || ''] = groups[o.group || ''] || []).push(o); });
    const optHTML = (o) => `<option value="${escapeHTML(o.value)}"${o.value === value ? ' selected' : ''}>${escapeHTML(o.label)}</option>`;
    const body = Object.keys(groups).map((g) => g ? `<optgroup label="${escapeHTML(g)}">${groups[g].map(optHTML).join('')}</optgroup>` : groups[g].map(optHTML).join('')).join('');
    const ph = placeholder ? `<option value="" disabled${value ? '' : ' selected'}>${escapeHTML(placeholder)}</option>` : '';
    this.innerHTML = ozFieldHTML(this, `<div class="oz-control"><select class="oz-select__el" id="${id}"${this.boolProp('disabled') ? ' disabled' : ''}>${ph}${body}</select><span class="oz-control__icon">${OZ_SVG.chevron}</span></div>`, id);
    const sel = this.querySelector('select');
    sel.addEventListener('change', () => { this.silentSet('value', sel.value); sound.click(); this.emit('oz-change', { value: sel.value }); });
  }
}

// 33. <oz-checkbox>
export class OzCheckbox extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'checked', 'indeterminate', 'description']; }
  get checked() { const i = this.querySelector('input'); return i ? i.checked : this.boolProp('checked'); }
  set checked(v) { const i = this.querySelector('input'); if (i) { i.checked = !!v; i.indeterminate = false; } this.silentSet('checked', !!v); }
  render() {
    const label = this.prop('label', ['text', 'title']);
    const desc = this.prop('description');
    const hint = this.prop('hint');
    const error = this.prop('error');
    const checked = this.boolProp('checked');
    const indet = this.boolProp('indeterminate');
    const dis = this.boolProp('disabled');
    this.innerHTML = `<div class="oz-field${error ? ' oz-field--error' : ''}${dis ? ' oz-field--disabled' : ''}"><label class="oz-check"><input type="checkbox" class="oz-check__input"${checked ? ' checked' : ''}${dis ? ' disabled' : ''} /><span class="oz-check__box"><span class="oz-check__tick">${OZ_SVG.check}</span><span class="oz-check__dash">${OZ_SVG.minus}</span></span><span class="oz-check__text">${label ? `<span class="oz-check__label">${escapeHTML(label)}</span>` : ''}${desc ? `<span class="oz-check__desc">${escapeHTML(desc)}</span>` : ''}</span></label>${error ? `<div class="oz-field__msg oz-field__msg--error">${escapeHTML(error)}</div>` : hint ? `<div class="oz-field__msg">${escapeHTML(hint)}</div>` : ''}</div>`;
    const input = this.querySelector('input');
    input.indeterminate = indet;
    input.addEventListener('change', () => {
      this.silentSet('checked', input.checked);
      this.silentSet('indeterminate', false);
      sound.toggle(input.checked);
      this.emit('oz-change', { checked: input.checked });
    });
  }
}

// 34. <oz-radio-group>
export class OzRadioGroup extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'options', 'variant', 'inline', 'name']; }
  get value() { const r = this.querySelector('input:checked'); return r ? r.value : this.getAttribute('value') || ''; }
  set value(v) { this.querySelectorAll('input').forEach((r) => { r.checked = r.value === v; }); this.silentSet('value', v); }
  render() {
    const opts = ozParseOptions(this);
    const value = this.prop('value', [], '');
    const name = this.prop('name', [], 'oz-radio-' + (this._uid || (this._uid = ozUid())));
    const variant = this.prop('variant', ['type'], 'default');
    const inline = this.boolProp('inline');
    const dis = this.boolProp('disabled');
    const items = opts.map((o) => `<label class="oz-radio${variant === 'cards' ? ' oz-radio--card' : ''}"><input type="radio" class="oz-radio__input" name="${escapeHTML(name)}" value="${escapeHTML(o.value)}"${o.value === value ? ' checked' : ''}${dis ? ' disabled' : ''} /><span class="oz-radio__dot"></span><span class="oz-radio__text"><span class="oz-radio__label">${escapeHTML(o.label)}</span>${o.desc ? `<span class="oz-radio__desc">${escapeHTML(o.desc)}</span>` : ''}</span></label>`).join('');
    this.innerHTML = ozFieldHTML(this, `<div class="oz-radios${inline ? ' oz-radios--inline' : ''}${variant === 'cards' ? ' oz-radios--cards' : ''}" role="radiogroup">${items}</div>`);
    this.querySelectorAll('input').forEach((r) => r.addEventListener('change', () => {
      this.silentSet('value', r.value);
      sound.click();
      this.emit('oz-change', { value: r.value });
    }));
  }
}

// 35. <oz-textarea>
export class OzTextarea extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'placeholder', 'rows', 'maxlength', 'autosize']; }
  get value() { const t = this.querySelector('textarea'); return t ? t.value : this._initial || ''; }
  set value(v) { const t = this.querySelector('textarea'); if (t) { t.value = v; this.sync(); } else this._initial = v; }
  render() {
    if (this._initial === undefined) this._initial = this.getAttribute('value') ?? this.captureSlotNodes().filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    const current = this.querySelector('textarea') ? this.querySelector('textarea').value : this._initial;
    const id = this._id || (this._id = 'oz-ta-' + ozUid());
    const max = this.numProp('maxlength', [], 0);
    this.innerHTML = ozFieldHTML(this, `<div class="oz-control oz-control--area"><textarea class="oz-textarea__el" id="${id}" rows="${this.numProp('rows', [], 4)}" placeholder="${escapeHTML(this.prop('placeholder'))}"${max ? ` maxlength="${max}"` : ''}${this.boolProp('disabled') ? ' disabled' : ''}>${escapeHTML(current)}</textarea>${max ? `<span class="oz-textarea__count"></span>` : ''}</div>`, id);
    const ta = this.querySelector('textarea');
    ta.addEventListener('input', () => { this.sync(); this.emit('oz-input', { value: ta.value }); });
    ta.addEventListener('change', () => this.emit('oz-change', { value: ta.value }));
    this.sync();
  }
  sync() {
    const ta = this.querySelector('textarea');
    if (!ta) return;
    if (this.boolProp('autosize')) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    const c = this.querySelector('.oz-textarea__count');
    if (c) c.textContent = `${ta.value.length} / ${ta.maxLength}`;
  }
}

// Shared calendar math helpers (local YYYY-MM-DD, no UTC off-by-one drift)
function ozTodayYMD() {
  const d = new Date();
  return ozFmtYMD(d.getFullYear(), d.getMonth(), d.getDate());
}
function ozFmtYMD(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function ozParseYMD(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '').trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}
function ozPrettyYMD(s) {
  const p = ozParseYMD(s);
  if (!p) return '';
  return new Date(p.y, p.m, p.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function ozAddDaysYMD(s, days) {
  const p = ozParseYMD(s) || ozParseYMD(ozTodayYMD());
  const dt = new Date(p.y, p.m, p.d + days);
  return ozFmtYMD(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function ozCalMonthHTML(viewY, viewM, selStart, selEnd, events, minDate, maxDate) {
  const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = ozTodayYMD();
  const firstDow = (new Date(viewY, viewM, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const prevDays = new Date(viewY, viewM, 0).getDate();
  const evMap = {};
  (events || []).forEach((ev) => { (evMap[ev.date] = evMap[ev.date] || []).push(ev); });
  const a = selStart && selEnd ? (selStart <= selEnd ? selStart : selEnd) : selStart;
  const b = selStart && selEnd ? (selStart <= selEnd ? selEnd : selStart) : '';

  const cells = [];
  for (let i = 0; i < 42; i++) {
    let cy = viewY, cm = viewM, cd, out = false;
    if (i < firstDow) { out = true; cm = viewM - 1; if (cm < 0) { cm = 11; cy--; } cd = prevDays - firstDow + i + 1; }
    else if (i >= firstDow + daysInMonth) { out = true; cm = viewM + 1; if (cm > 11) { cm = 0; cy++; } cd = i - firstDow - daysInMonth + 1; }
    else cd = i - firstDow + 1;
    const ymd = ozFmtYMD(cy, cm, cd);
    const disabled = (minDate && ymd < minDate) || (maxDate && ymd > maxDate);
    const isSel = ymd === a || (b && ymd === b);
    const inRange = a && b && ymd > a && ymd < b;
    const cls = 'oz-cal__day' + (out ? ' is-out' : '') + (ymd === today ? ' is-today' : '') + (inRange ? ' is-range' : '') + (isSel ? ' is-selected' : '');
    const dots = (evMap[ymd] || []).slice(0, 3).map((e) => `<i class="oz-cal__dot oz-cal__dot--${escapeHTML(e.color || 'cyan')}"></i>`).join('');
    cells.push(`<button type="button" class="${cls}" data-ymd="${ymd}"${disabled ? ' disabled' : ''} aria-label="${ymd}">${cd}<span class="oz-cal__dots">${dots}</span></button>`);
  }
  const wds = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => `<div class="oz-cal__wd">${w}</div>`).join('');
  return `<div class="oz-cal__head"><span class="oz-cal__month">${escapeHTML(monthLabel)}</span><div class="oz-cal__nav"><button type="button" class="oz-cal__btn" data-cal-prev aria-label="Previous month">&#8249;</button><button type="button" class="oz-cal__today" data-cal-today>Today</button><button type="button" class="oz-cal__btn" data-cal-next aria-label="Next month">&#8250;</button></div></div><div class="oz-cal__grid">${wds}${cells.join('')}</div>`;
}

// 36. <oz-slider> (single or dual-thumb range + optional ticks)
export class OzSlider extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'min', 'max', 'step', 'value', 'min-value', 'max-value', 'range', 'ticks', 'prefix', 'suffix', 'show-value']; }
  get value() {
    if (this.boolProp('range')) { const [a, b] = this.querySelectorAll('input'); return a && b ? `${a.value},${b.value}` : ''; }
    const r = this.querySelector('input'); return r ? Number(r.value) : this.numProp('value', [], 0);
  }
  set value(v) { const r = this.querySelector('input'); if (r && !this.boolProp('range')) { r.value = v; this.paint(); } this.silentSet('value', v); }
  render() {
    const min = this.numProp('min', [], 0), max = this.numProp('max', [], 100), step = this.numProp('step', [], 1);
    const isRange = this.boolProp('range');
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    const showVal = this.boolProp('show-value', ['value-label']) || isRange;
    const ticks = this.boolProp('ticks') ? `<div class="oz-slider__ticks">${[0, 0.25, 0.5, 0.75, 1].map((t) => `<span>${this.fmt(Math.round(min + (max - min) * t))}</span>`).join('')}</div>` : '';
    if (isRange) {
      const lo = this.numProp('min-value', [], Math.round(min + (max - min) * 0.2));
      const hi = this.numProp('max-value', [], Math.round(min + (max - min) * 0.75));
      this.innerHTML = ozFieldHTML(this, `<div class="oz-slider"><div class="oz-slider__wrap"><div class="oz-slider__dual"><div class="oz-slider__track"><div class="oz-slider__fill"></div></div><input type="range" class="oz-slider__el--dual" data-thumb="lo" min="${min}" max="${max}" step="${step}" value="${Math.min(lo, hi)}"${dis} /><input type="range" class="oz-slider__el--dual" data-thumb="hi" min="${min}" max="${max}" step="${step}" value="${Math.max(lo, hi)}"${dis} /></div>${ticks}</div>${showVal ? '<output class="oz-slider__out"></output>' : ''}</div>`);
      const [a, b] = this.querySelectorAll('input');
      const sync = (who, emitChange) => {
        let v1 = Number(a.value), v2 = Number(b.value);
        if (v1 > v2) { if (who === 'lo') { v1 = v2; a.value = v1; } else { v2 = v1; b.value = v2; } }
        this.paint();
        this.silentSet('min-value', v1); this.silentSet('max-value', v2);
        this.emit(emitChange ? 'oz-change' : 'oz-input', { min: v1, max: v2, value: `${v1},${v2}` });
      };
      a.addEventListener('input', () => sync('lo', false));
      b.addEventListener('input', () => sync('hi', false));
      a.addEventListener('change', () => { sound.click(); sync('lo', true); });
      b.addEventListener('change', () => { sound.click(); sync('hi', true); });
    } else {
      const value = this.numProp('value', [], Math.round((min + max) / 2));
      const id = this._id || (this._id = 'oz-sl-' + ozUid());
      this.innerHTML = ozFieldHTML(this, `<div class="oz-slider"><div class="oz-slider__wrap"><input type="range" class="oz-slider__el" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"${dis} />${ticks}</div>${showVal ? '<output class="oz-slider__out"></output>' : ''}</div>`, id);
      const r = this.querySelector('input');
      r.addEventListener('input', () => { this.paint(); this.silentSet('value', r.value); this.emit('oz-input', { value: Number(r.value) }); });
      r.addEventListener('change', () => { sound.click(); this.emit('oz-change', { value: Number(r.value) }); });
    }
    this.paint();
  }
  fmt(n) { return `${this.prop('prefix', [], '')}${Number(n).toLocaleString()}${this.prop('suffix', [], '')}`; }
  paint() {
    const out = this.querySelector('.oz-slider__out');
    if (this.boolProp('range')) {
      const [a, b] = this.querySelectorAll('input');
      if (!a || !b) return;
      const min = Number(a.min), span = (Number(a.max) - min) || 1;
      const fill = this.querySelector('.oz-slider__fill');
      if (fill) {
        fill.style.setProperty('--start', (((Number(a.value) - min) / span) * 100) + '%');
        fill.style.setProperty('--end', (((Number(b.value) - min) / span) * 100) + '%');
      }
      if (out) out.textContent = `${this.fmt(a.value)} – ${this.fmt(b.value)}`;
      return;
    }
    const r = this.querySelector('input');
    if (!r) return;
    const pct = ((Number(r.value) - Number(r.min)) / ((Number(r.max) - Number(r.min)) || 1)) * 100;
    r.style.setProperty('--fill', pct + '%');
    if (out) out.textContent = this.fmt(r.value);
  }
}

// 37. <oz-date-picker> (modern floating glass calendar popover + quick presets)
export class OzDatePicker extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'start', 'end', 'range', 'min', 'max', 'placeholder', 'events']; }
  get value() { return this.boolProp('range') ? (this._start && this._end ? `${this._start}..${this._end}` : this._start || '') : (this._val || ''); }
  set value(v) { this._val = String(v || ''); this.silentSet('value', this._val); this.paintBtn(); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.popEl && this.popEl.contains(e.target))) this.close(); };
    this._reflow = () => { if (this._open) this.close(); };
    this._onKey = (e) => { if (e.key === 'Escape' && this._open) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    document.addEventListener('keydown', this._onKey);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.popEl) this.popEl.remove();
  }
  render() {
    const isRange = this.boolProp('range');
    this._val = this.prop('value', [], '');
    this._start = this.prop('start', [], '');
    this._end = this.prop('end', [], '');
    const base = ozParseYMD(isRange ? this._start : this._val) || ozParseYMD(ozTodayYMD());
    this._vy = base.y; this._vm = base.m;
    this._open = false;
    if (this.popEl) this.popEl.remove();
    this.innerHTML = ozFieldHTML(this, `<button type="button" class="oz-dp__trigger" aria-haspopup="dialog" aria-expanded="false"${this.boolProp('disabled') ? ' disabled' : ''}><span class="oz-dp__val"></span><span style="display:grid;place-items:center;color:var(--oz-text-muted);">${OZ_SVG.calendar}</span></button>`);
    this.trigBtn = this.querySelector('.oz-dp__trigger');
    this.popEl = document.createElement('div');
    this.popEl.className = 'oz-dp__pop';
    this.popEl.hidden = true;
    document.body.appendChild(this.popEl);
    this.trigBtn.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.paintBtn();
  }
  paintBtn() {
    const span = this.querySelector('.oz-dp__val');
    if (!span) return;
    if (this.boolProp('range')) {
      if (this._start && this._end) span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._start))} – ${escapeHTML(ozPrettyYMD(this._end))}</span>`;
      else if (this._start) span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._start))} – …</span>`;
      else span.innerHTML = `<span class="oz-dp__ph">${escapeHTML(this.prop('placeholder', [], 'Select date range...'))}</span>`;
    } else if (this._val) {
      span.innerHTML = `<span>${escapeHTML(ozPrettyYMD(this._val))}</span>`;
    } else {
      span.innerHTML = `<span class="oz-dp__ph">${escapeHTML(this.prop('placeholder', [], 'Choose date...'))}</span>`;
    }
  }
  paintPop() {
    const isRange = this.boolProp('range');
    const events = this.jsonProp('events', [], []);
    const today = ozTodayYMD();
    const presets = [
      { label: 'Today', val: today },
      { label: 'Tomorrow', val: ozAddDaysYMD(today, 1) },
      { label: '+7 Days', val: ozAddDaysYMD(today, 7) },
      { label: '+30 Days', val: ozAddDaysYMD(today, 30) }
    ];
    this.popEl.innerHTML = `<div class="oz-dp__presets">${presets.map((p) => `<button type="button" class="oz-dp__preset" data-preset="${p.val}">${p.label}</button>`).join('')}<button type="button" class="oz-dp__preset" data-clear style="margin-left:auto;">Clear</button></div>${ozCalMonthHTML(this._vy, this._vm, isRange ? this._start : this._val, isRange ? this._end : '', events, this.prop('min'), this.prop('max'))}`;
    this.popEl.querySelector('[data-cal-prev]').addEventListener('click', () => { this._vm--; if (this._vm < 0) { this._vm = 11; this._vy--; } this.paintPop(); });
    this.popEl.querySelector('[data-cal-next]').addEventListener('click', () => { this._vm++; if (this._vm > 11) { this._vm = 0; this._vy++; } this.paintPop(); });
    this.popEl.querySelector('[data-cal-today]').addEventListener('click', () => { const t = ozParseYMD(today); this._vy = t.y; this._vm = t.m; this.pick(today); });
    this.popEl.querySelector('[data-clear]').addEventListener('click', () => {
      this._val = ''; this._start = ''; this._end = '';
      this.silentSet('value', ''); this.silentSet('start', ''); this.silentSet('end', '');
      this.paintBtn(); this.emit('oz-change', { value: '', start: '', end: '' }); this.close();
    });
    this.popEl.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.preset, true)));
    this.popEl.querySelectorAll('[data-ymd]').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.ymd, false)));
  }
  pick(ymd, fromPreset) {
    sound.click();
    if (this.boolProp('range')) {
      if (fromPreset) {
        this._start = ozTodayYMD(); this._end = ymd >= this._start ? ymd : this._start;
      } else if (!this._start || (this._start && this._end)) {
        this._start = ymd; this._end = '';
        this.paintBtn(); this.paintPop(); return;
      } else {
        if (ymd < this._start) { this._end = this._start; this._start = ymd; }
        else this._end = ymd;
      }
      this.silentSet('start', this._start); this.silentSet('end', this._end);
      this.paintBtn();
      this.emit('oz-change', { value: `${this._start}..${this._end}`, start: this._start, end: this._end });
      this.close();
      return;
    }
    this._val = ymd;
    const p = ozParseYMD(ymd); if (p) { this._vy = p.y; this._vm = p.m; }
    this.silentSet('value', ymd);
    this.paintBtn();
    this.emit('oz-change', { value: ymd });
    this.close();
  }
  open() {
    if (this.boolProp('disabled')) return;
    this._open = true;
    this.trigBtn.setAttribute('aria-expanded', 'true');
    this.paintPop();
    this.popEl.hidden = false;
    const r = this.trigBtn.getBoundingClientRect();
    const pw = this.popEl.offsetWidth || 340, ph = this.popEl.offsetHeight || 340;
    this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - pw - 12))}px`;
    if (window.innerHeight - r.bottom < ph + 12 && r.top > window.innerHeight - r.bottom) {
      this.popEl.style.top = 'auto'; this.popEl.style.bottom = `${window.innerHeight - r.top + 8}px`;
    } else {
      this.popEl.style.bottom = 'auto'; this.popEl.style.top = `${r.bottom + 8}px`;
    }
  }
  close() {
    this._open = false;
    if (this.trigBtn) this.trigBtn.setAttribute('aria-expanded', 'false');
    if (this.popEl) this.popEl.hidden = true;
  }
}

// 38. <oz-file-upload> (Browse button, thumbnails, upload progress & preloaded files)
export class OzFileUpload extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'accept', 'multiple', 'max-size', 'prompt', 'description', 'files']; }
  get files() { return (this._files || []).slice(); }
  fmt(b) {
    if (typeof b === 'string') return b;
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';
  }
  render() {
    if (!this._files) {
      const seed = this.jsonProp('files', [], []);
      this._files = Array.isArray(seed) ? seed.map((f) => ({ name: f.name || 'file', size: f.size || 0, type: f.type || '', preview: f.preview || '' })) : [];
    }
    const accept = this.prop('accept');
    const multiple = this.boolProp('multiple');
    const maxMb = this.numProp('max-size', ['maxsize'], 0);
    const title = this.prop('prompt', ['heading'], 'Drop files here or click to browse');
    const desc = this.prop('description', [], [accept, maxMb ? `up to ${maxMb} MB` : ''].filter(Boolean).join(' • '));
    this.innerHTML = ozFieldHTML(this, `<label class="oz-drop"><input type="file" class="oz-drop__input"${accept ? ` accept="${escapeHTML(accept)}"` : ''}${multiple ? ' multiple' : ''}${this.boolProp('disabled') ? ' disabled' : ''} /><span class="oz-drop__icon">${OZ_SVG.upload}</span><span class="oz-drop__title">${escapeHTML(title)}</span>${desc ? `<span class="oz-drop__desc">${escapeHTML(desc)}</span>` : ''}<span class="oz-drop__browse">Browse Files</span></label><div class="oz-drop__error" role="alert"></div><ul class="oz-drop__list"></ul>`);
    const zone = this.querySelector('.oz-drop');
    const input = this.querySelector('input');
    const add = (list) => {
      const errs = [];
      let incoming = Array.from(list);
      if (!multiple) { incoming = incoming.slice(0, 1); this._files = []; }
      incoming.forEach((f) => {
        if (maxMb && f.size > maxMb * 1048576) errs.push(`${f.name} is larger than ${maxMb} MB`);
        else {
          if (f.type && f.type.startsWith('image/')) f._preview = URL.createObjectURL(f);
          this._files.push(f);
        }
      });
      this.querySelector('.oz-drop__error').textContent = errs.join(' · ');
      sound.success();
      this.list();
      this.emit('oz-files', { files: this.files });
      this.emit('oz-change', { files: this.files });
      input.value = '';
    };
    input.addEventListener('change', () => add(input.files));
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = 'true'; }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = 'false'; }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
    this.list();
  }
  list() {
    const ul = this.querySelector('.oz-drop__list');
    if (!ul) return;
    ul.innerHTML = this._files.map((f, i) => {
      const thumb = f._preview || f.preview;
      return `<li class="oz-drop__item">${thumb ? `<img class="oz-drop__thumb" src="${escapeHTML(thumb)}" alt="" />` : `<span class="oz-drop__file">${OZ_SVG.file}</span>`}<div class="oz-drop__meta"><div class="oz-drop__top"><span class="oz-drop__name">${escapeHTML(f.name)}</span><span class="oz-drop__done">Uploaded</span><span class="oz-drop__size">${this.fmt(f.size)}</span></div><div class="oz-drop__bar"><span style="width:100%;"></span></div></div><button type="button" class="oz-drop__remove" data-i="${i}" aria-label="Remove ${escapeHTML(f.name)}">${OZ_SVG.x}</button></li>`;
    }).join('');
    ul.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const [rm] = this._files.splice(Number(b.dataset.i), 1);
      if (rm && rm._preview) try { URL.revokeObjectURL(rm._preview); } catch (e) {}
      sound.click();
      this.list();
      this.emit('oz-files', { files: this.files });
      this.emit('oz-change', { files: this.files });
    }));
  }
}

// 39. <oz-combobox> (searchable single / multi select with chips)
export class OzCombobox extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'required', 'value', 'options', 'placeholder', 'multiple', 'creatable']; }
  get value() { return this.vals.join(','); }
  set value(v) { this.vals = String(v || '').split(',').map((s) => s.trim()).filter(Boolean); this.silentSet('value', this.value); if (this.box) this.draw(); }
  get values() { return this.vals.slice(); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.listEl && this.listEl.contains(e.target))) this.close(); };
    this._reflow = (e) => { if (this._open && !(this.listEl && e && this.listEl.contains(e.target))) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.listEl) this.listEl.remove();
  }
  render() {
    this.opts = ozParseOptions(this);
    if (!this.vals) this.vals = this.prop('value', [], '').split(',').map((s) => s.trim()).filter(Boolean);
    this.multi = this.boolProp('multiple');
    this.query = '';
    this._open = false;
    this.active = 0;
    const id = this._id || (this._id = 'oz-cb-' + ozUid());
    if (this.listEl) this.listEl.remove();
    this.innerHTML = ozFieldHTML(this, `<div class="oz-combo"><div class="oz-combo__box" role="combobox" aria-expanded="false" aria-haspopup="listbox"><span class="oz-combo__chips"></span><input class="oz-combo__input" id="${id}" autocomplete="off" placeholder="${escapeHTML(this.prop('placeholder', [], 'Select...'))}"${this.boolProp('disabled') ? ' disabled' : ''} /><span class="oz-control__icon">${OZ_SVG.chevron}</span></div></div>`, id);
    this.box = this.querySelector('.oz-combo__box');
    this.input = this.querySelector('input');
    this.listEl = document.createElement('ul');
    this.listEl.className = 'oz-combo__list';
    this.listEl.setAttribute('role', 'listbox');
    this.listEl.hidden = true;
    document.body.appendChild(this.listEl);
    this.box.addEventListener('click', (e) => { if (e.target.closest('[data-rm]')) return; this.input.focus(); this.openList(); });
    this.input.addEventListener('input', () => { this.query = this.input.value; this.active = 0; this.openList(); });
    this.input.addEventListener('keydown', (e) => this.key(e));
    this.input.addEventListener('focus', () => { if (!this.multi) this.input.select(); });
    this.listEl.addEventListener('pointerdown', (e) => e.preventDefault());
    this.listEl.addEventListener('click', (e) => { const li = e.target.closest('[data-v]'); if (li) this.pick(li.dataset.v); });
    this.draw();
  }
  labelOf(v) { const o = this.opts.find((x) => x.value === v); return o ? o.label : v; }
  filtered() {
    const q = this.query.trim().toLowerCase();
    let list = this.opts.filter((o) => (!q || o.label.toLowerCase().includes(q)) && (!this.multi || !this.vals.includes(o.value)));
    if (this.boolProp('creatable') && q && !this.opts.some((o) => o.label.toLowerCase() === q)) list = list.concat([{ value: this.query.trim(), label: `Create "${this.query.trim()}"`, created: true }]);
    return list;
  }
  draw() {
    const chips = this.querySelector('.oz-combo__chips');
    if (this.multi) {
      chips.innerHTML = this.vals.map((v) => `<span class="oz-chip">${escapeHTML(this.labelOf(v))}<button type="button" data-rm="${escapeHTML(v)}" aria-label="Remove">${OZ_SVG.x}</button></span>`).join('');
      chips.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => this.unpick(b.dataset.rm)));
      this.input.placeholder = this.vals.length ? '' : this.prop('placeholder', [], 'Select...');
    } else {
      chips.innerHTML = '';
      if (!this._open) this.input.value = this.vals[0] ? this.labelOf(this.vals[0]) : '';
    }
    this.paintList();
  }
  paintList() {
    const list = this.filtered();
    if (this.active >= list.length) this.active = Math.max(0, list.length - 1);
    this.listEl.innerHTML = list.length ? list.map((o, i) => `<li role="option" class="oz-combo__opt${i === this.active ? ' is-active' : ''}${!this.multi && this.vals[0] === o.value ? ' is-selected' : ''}" data-v="${escapeHTML(o.value)}" aria-selected="${this.vals.includes(o.value)}">${escapeHTML(o.label)}${!this.multi && this.vals[0] === o.value ? `<span class="oz-combo__tick">${OZ_SVG.check}</span>` : ''}</li>`).join('') : '<li class="oz-combo__empty">No matches</li>';
  }
  place() {
    const r = this.box.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    this.listEl.style.left = r.left + 'px';
    this.listEl.style.width = r.width + 'px';
    if (below < 220 && r.top > below) { this.listEl.style.top = 'auto'; this.listEl.style.bottom = (window.innerHeight - r.top + 6) + 'px'; }
    else { this.listEl.style.bottom = 'auto'; this.listEl.style.top = (r.bottom + 6) + 'px'; }
  }
  openList() {
    if (this.boolProp('disabled')) return;
    this._open = true;
    this.box.setAttribute('aria-expanded', 'true');
    this.box.dataset.open = 'true';
    this.paintList();
    this.listEl.hidden = false;
    this.place();
  }
  close() {
    this._open = false;
    this.query = '';
    if (this.box) { this.box.setAttribute('aria-expanded', 'false'); this.box.dataset.open = 'false'; }
    if (this.listEl) this.listEl.hidden = true;
    if (this.multi && this.input) this.input.value = '';
    this.draw();
  }
  pick(v) {
    if (this.multi) { if (!this.vals.includes(v)) this.vals.push(v); this.query = ''; this.input.value = ''; this.input.focus(); }
    else { this.vals = [v]; }
    if (!this.opts.some((o) => o.value === v)) this.opts.push({ value: v, label: v });
    this.silentSet('value', this.value);
    sound.click();
    this.emit('oz-change', { value: this.value, values: this.values });
    if (this.multi) { this.draw(); this.place(); } else this.close();
  }
  unpick(v) {
    this.vals = this.vals.filter((x) => x !== v);
    this.silentSet('value', this.value);
    this.emit('oz-change', { value: this.value, values: this.values });
    this.draw();
  }
  key(e) {
    const list = this.filtered();
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!this._open) this.openList(); this.active = Math.min(list.length - 1, this.active + 1); this.paintList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active = Math.max(0, this.active - 1); this.paintList(); }
    else if (e.key === 'Enter') { if (this._open && list[this.active]) { e.preventDefault(); this.pick(list[this.active].value); } }
    else if (e.key === 'Escape') { this.close(); }
    else if (e.key === 'Backspace' && this.multi && !this.input.value && this.vals.length) { this.unpick(this.vals[this.vals.length - 1]); }
  }
}

// 40. <oz-sidebar>
let OZ_SIDEBAR_GLOBAL = false;
export class OzSidebar extends OzoneElement {
  static get observedAttributes() { return ['brand', 'icon', 'items', 'collapsed', 'side', 'variant', 'active', 'searchable', 'user-name', 'user-email', 'width']; }
  connectedCallback() {
    super.connectedCallback();
    if (!OZ_SIDEBAR_GLOBAL) {
      OZ_SIDEBAR_GLOBAL = true;
      document.addEventListener('click', (e) => {
        const t = e.target.closest && e.target.closest('[data-oz-sidebar-toggle]');
        if (t) document.dispatchEvent(new CustomEvent('oz-sidebar-toggle', { detail: { target: t.getAttribute('data-oz-sidebar-toggle') } }));
      });
    }
    this._mq = window.matchMedia('(max-width: 900px)');
    this._onMq = () => { this.dataset.mobile = String(this._mq.matches); if (!this._mq.matches) this.removeAttribute('data-mobile-open'); };
    this._mq.addEventListener('change', this._onMq);
    this._onToggle = (e) => {
      const tgt = e.detail && e.detail.target;
      if (tgt && tgt !== '' && tgt !== this.id) return;
      this.toggle();
    };
    this._onKey = (e) => { if (e.key === 'Escape' && this.dataset.mobileOpen === 'true') this.close(); };
    document.addEventListener('oz-sidebar-toggle', this._onToggle);
    document.addEventListener('keydown', this._onKey);
    this._onMq();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._mq) this._mq.removeEventListener('change', this._onMq);
    document.removeEventListener('oz-sidebar-toggle', this._onToggle);
    document.removeEventListener('keydown', this._onKey);
  }
  get collapsed() { return this.boolProp('collapsed'); }
  set collapsed(v) { if (v) this.setAttribute('collapsed', ''); else this.removeAttribute('collapsed'); this.save(); this.emit('oz-collapse', { collapsed: !!v }); }
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })); }
  open() { this.dataset.mobileOpen = 'true'; }
  close() { this.dataset.mobileOpen = 'false'; }
  toggle() {
    if (this.dataset.mobile === 'true') { this.dataset.mobileOpen = this.dataset.mobileOpen === 'true' ? 'false' : 'true'; }
    else { this.collapsed = !this.collapsed; }
  }
  save() {
    const key = this.prop('persist-key');
    if (!key) return;
    try { localStorage.setItem('oz-sb:' + key, JSON.stringify({ collapsed: this.collapsed, open: Array.from(this._openSet || []) })); } catch (e) { /* storage unavailable */ }
  }
  normalize() {
    const raw = this.jsonProp('items', [], []) || [];
    if (!Array.isArray(raw)) return [];
    if (raw.length && raw[0] && Array.isArray(raw[0].items)) return raw;
    return [{ title: '', items: raw }];
  }
  render() {
    const key = this.prop('persist-key');
    if (!this._init) {
      this._init = true;
      this._openSet = new Set();
      this._query = '';
      if (key) {
        try {
          const s = JSON.parse(localStorage.getItem('oz-sb:' + key) || 'null');
          if (s) { (s.open || []).forEach((x) => this._openSet.add(x)); if (s.collapsed) this.setAttribute('collapsed', ''); }
        } catch (e) { /* ignore */ }
      }
    }
    const footerNodes = this.captureSlotNodes().filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
    const brand = this.prop('brand', ['title'], '');
    const icon = this.prop('icon', [], 'diamond');
    const groups = this.normalize();
    const activeKey = this.prop('active', [], '') || this._activeKey || '';
    const idOf = (it) => String(it.id || it.label);
    const isActive = (it) => (activeKey ? idOf(it) === activeKey : it.active === true);
    const q = this._query.trim().toLowerCase();
    const matches = (it) => !q || String(it.label).toLowerCase().includes(q) || (it.children || []).some((c) => String(c.label).toLowerCase().includes(q));
    const badge = (it) => it.badge ? `<span class="oz-sb__badge oz-sb__badge--${escapeHTML(it.badgeVariant || 'cyan')}">${escapeHTML(it.badge)}</span>` : '';
    const iconHTML = (it) => it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="18"></oz-icon>` : `<span class="oz-sb__dot"></span>`;
    const itemHTML = (it) => {
      const kids = (it.children || []).filter((c) => !q || matches(c) || matches(it));
      const has = kids.length > 0;
      const open = has && (this._openSet.has(idOf(it)) || !!q || kids.some(isActive));
      const cls = 'oz-sb__item' + (isActive(it) || (has && !open && kids.some(isActive)) ? ' is-active' : '') + (it.disabled ? ' is-disabled' : '');
      const tag = has ? 'button type="button"' : `a href="${escapeHTML(it.href || '#')}"`;
      const close = has ? 'button' : 'a';
      const sub = has ? `<div class="oz-sb__sub" data-open="${open}"><div class="oz-sb__sub-inner">${kids.map((c) => `<a class="oz-sb__item oz-sb__item--child${isActive(c) ? ' is-active' : ''}" href="${escapeHTML(c.href || '#')}" data-id="${escapeHTML(idOf(c))}" data-label="${escapeHTML(c.label)}"><span class="oz-sb__label">${escapeHTML(c.label)}</span>${badge(c)}</a>`).join('')}</div></div>` : '';
      return `<div class="oz-sb__node"><${tag} class="${cls}" data-id="${escapeHTML(idOf(it))}" data-label="${escapeHTML(it.label)}" data-has-kids="${has}" data-tip="${escapeHTML(it.label)}"${it.disabled ? ' aria-disabled="true"' : ''}${has ? ` aria-expanded="${open}"` : ''}>${iconHTML(it)}<span class="oz-sb__label">${escapeHTML(it.label)}</span>${badge(it)}${has ? `<span class="oz-sb__caret" data-open="${open}">${OZ_SVG.chevron}</span>` : ''}</${close}>${sub}</div>`;
    };
    const nav = groups.map((g) => {
      const its = (g.items || []).filter((it) => matches(it) || (it.children || []).some(matches));
      if (!its.length) return '';
      return `<div class="oz-sb__group">${g.title ? `<div class="oz-sb__title">${escapeHTML(g.title)}</div>` : ''}${its.map(itemHTML).join('')}</div>`;
    }).join('') || '<div class="oz-sb__empty">No results</div>';
    const uname = this.prop('user-name');
    const user = uname ? `<div class="oz-sb__user"><oz-avatar name="${escapeHTML(uname)}" size="36" status="online"></oz-avatar><div class="oz-sb__user-text"><div class="oz-sb__user-name">${escapeHTML(uname)}</div>${this.prop('user-email') ? `<div class="oz-sb__user-mail">${escapeHTML(this.prop('user-email'))}</div>` : ''}</div></div>` : '';
    const side = this.prop('side', [], 'left') === 'right' ? 'right' : 'left';
    this.dataset.side = side;
    this.dataset.variant = this.prop('variant', [], 'glass');
    this.style.setProperty('--oz-sb-w', this.prop('width', [], '264px'));
    this.innerHTML = `<div class="oz-sb__backdrop" data-sb-backdrop></div><aside class="oz-sb" role="navigation" aria-label="${escapeHTML(brand || 'Sidebar')}"><div class="oz-sb__head">${brand ? `<div class="oz-sb__brand"><span class="oz-sb__logo"><oz-icon name="${escapeHTML(icon)}" size="18"></oz-icon></span><span class="oz-sb__brand-name">${escapeHTML(brand)}</span></div>` : ''}<button type="button" class="oz-sb__collapse" data-sb-collapse title="Collapse sidebar" aria-label="Toggle sidebar">${OZ_SVG.panel}</button></div>${this.boolProp('searchable') ? `<div class="oz-sb__search"><oz-icon name="search" size="15"></oz-icon><input type="search" placeholder="Search..." value="${escapeHTML(this._query)}" data-sb-search /></div>` : ''}<nav class="oz-sb__nav">${nav}</nav><div class="oz-sb__foot">${user}<div class="oz-sb__foot-slot"></div></div></aside>`;
    const slot = this.querySelector('.oz-sb__foot-slot');
    footerNodes.forEach((n) => slot.appendChild(n));
    if (!slot.childNodes.length) slot.remove();
    this.querySelector('[data-sb-backdrop]').addEventListener('click', () => this.close());
    this.querySelector('[data-sb-collapse]').addEventListener('click', () => { sound.click(); if (this.dataset.mobile === 'true') this.close(); else this.collapsed = !this.collapsed; });
    const search = this.querySelector('[data-sb-search]');
    if (search) {
      search.addEventListener('input', () => { this._query = search.value; const pos = search.selectionStart; this.render(); const s = this.querySelector('[data-sb-search]'); if (s) { s.focus(); s.setSelectionRange(pos, pos); } });
    }
    this.querySelectorAll('.oz-sb__item').forEach((el) => el.addEventListener('click', (e) => {
      if (el.classList.contains('is-disabled')) { e.preventDefault(); return; }
      const id = el.dataset.id;
      if (el.dataset.hasKids === 'true') {
        e.preventDefault();
        if (this.collapsed) { this.collapsed = false; this._openSet.add(id); this.render(); return; }
        if (this._openSet.has(id)) this._openSet.delete(id); else this._openSet.add(id);
        this.save();
        this.render();
        return;
      }
      const ev = new CustomEvent('oz-navigate', { detail: { id, label: el.dataset.label, href: el.getAttribute('href') }, bubbles: true, cancelable: true });
      this.dispatchEvent(ev);
      if (ev.defaultPrevented || (el.getAttribute('href') || '#') === '#') e.preventDefault();
      sound.click();
      this._activeKey = id;
      this.removeAttribute('active');
      this.render();
      if (this.dataset.mobile === 'true') this.close();
    }));
  }
}

// 41. <oz-app-shell>
export class OzAppShell extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'topbar', 'fill']; }
  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      const sidebars = [], actions = [], content = [];
      nodes.forEach((n) => {
        if (n.nodeType === 1 && n.tagName === 'OZ-SIDEBAR') sidebars.push(n);
        else if (n.nodeType === 1 && n.getAttribute('slot') === 'actions') actions.push(n);
        else if (!(n.nodeType === 3 && !n.textContent.trim())) content.push(n);
      });
      this.innerHTML = `<div class="oz-shell__body"><div class="oz-shell__side"></div><div class="oz-shell__main"><header class="oz-shell__topbar"><button type="button" class="oz-shell__burger" data-oz-sidebar-toggle="" aria-label="Open menu">${OZ_SVG.burger}</button><div class="oz-shell__heading"><div class="oz-shell__title"></div><div class="oz-shell__subtitle"></div></div><div class="oz-shell__actions"></div></header><div class="oz-shell__content"></div></div></div>`;
      const side = this.querySelector('.oz-shell__side');
      sidebars.forEach((s) => side.appendChild(s));
      if (sidebars[0] && sidebars[0].getAttribute('side') === 'right') this.dataset.sidebarSide = 'right';
      if (!sidebars.length) this.querySelector('.oz-shell__burger').remove();
      this.dataset.hasSidebar = String(sidebars.length > 0);
      const act = this.querySelector('.oz-shell__actions');
      actions.forEach((a) => act.appendChild(a));
      const main = this.querySelector('.oz-shell__content');
      content.forEach((c) => main.appendChild(c));
    }
    const title = this.prop('heading', ['title']);
    const sub = this.prop('subtitle');
    this.querySelector('.oz-shell__title').textContent = title;
    this.querySelector('.oz-shell__subtitle').textContent = sub;
    this.querySelector('.oz-shell__subtitle').style.display = sub ? '' : 'none';
    const showTop = this.hasAttribute('topbar') ? this.boolProp('topbar') : true;
    this.querySelector('.oz-shell__topbar').style.display = showTop ? '' : 'none';
    this.dataset.fill = String(this.boolProp('fill'));
  }
}

// ============================================================================
// OzoneUI Pack F: Parallax, Spatial Motion & Modern Interactive Components
// <oz-parallax>, <oz-reveal>, <oz-spotlight>, <oz-drawer>, <oz-dropdown>,
// <oz-tooltip>, <oz-stepper>, <oz-kanban>
// ============================================================================

// 42. <oz-parallax>
export class OzParallax extends OzoneElement {
  static get observedAttributes() { return ['speed', 'direction', 'height', 'badge', 'heading', 'title', 'subtitle', 'tilt']; }

  connectedCallback() {
    super.connectedCallback();
    this._mx = 0; this._my = 0; this._sy = 0; this._raf = 0;
    this._schedule = () => {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = 0; this.updateLayers(); });
    };
    this._onMove = (e) => {
      const r = this.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this._mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this._my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      this._schedule();
    };
    this._onLeave = () => { this._mx = 0; this._my = 0; this._schedule(); };
    this._onScroll = () => {
      const r = this.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const center = r.top + r.height / 2;
      this._sy = Math.max(-1.5, Math.min(1.5, (vh / 2 - center) / vh));
      this._schedule();
    };
    this.addEventListener('pointermove', this._onMove);
    this.addEventListener('pointerleave', this._onLeave);
    window.addEventListener('scroll', this._onScroll, { passive: true, capture: true });
    window.addEventListener('resize', this._onScroll, { passive: true });
    this._onScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._raf) cancelAnimationFrame(this._raf);
    this.removeEventListener('pointermove', this._onMove);
    this.removeEventListener('pointerleave', this._onLeave);
    window.removeEventListener('scroll', this._onScroll, { capture: true });
    window.removeEventListener('resize', this._onScroll);
  }

  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<div class="oz-px__tilt"><div class="oz-px__bg" aria-hidden="true"><div class="oz-px__orb oz-px__orb--1" data-depth="-0.35"></div><div class="oz-px__orb oz-px__orb--2" data-depth="0.45"></div><div class="oz-px__grid" data-depth="0.18"></div></div><div class="oz-px__stage"><div class="oz-px__header"></div><div class="oz-px__content"></div></div></div>`;
      const content = this.querySelector('.oz-px__content');
      const meaningful = nodes.filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
      if (meaningful.length) meaningful.forEach((n) => content.appendChild(n));
      else content.remove();
    }
    const h = this.prop('height', [], '');
    if (h) this.style.setProperty('--oz-px-h', h);
    const badge = this.prop('badge');
    const title = this.prop('heading', ['title']);
    const sub = this.prop('subtitle');
    const head = this.querySelector('.oz-px__header');
    if (head) {
      if (badge || title || sub) {
        head.style.display = '';
        head.innerHTML = `${badge ? `<oz-badge variant="cyan" pulse data-depth="0.18">${escapeHTML(badge)}</oz-badge>` : ''}${title ? `<h2 class="oz-px__title" data-depth="0.28">${escapeHTML(title)}</h2>` : ''}${sub ? `<p class="oz-px__subtitle" data-depth="0.14">${escapeHTML(sub)}</p>` : ''}`;
      } else {
        head.style.display = 'none';
      }
    }
  }

  updateLayers() {
    if (!this.isConnected) return;
    const speed = Math.max(0.05, this.numProp('speed', [], 1));
    const dir = this.prop('direction', [], 'both').toLowerCase();
    const useScroll = dir !== 'mouse' && dir !== 'horizontal';
    const useMouse = dir !== 'vertical';
    const tiltBox = this.querySelector('.oz-px__tilt');
    if (tiltBox && this.hasAttribute('tilt') && useMouse) {
      tiltBox.style.transform = `perspective(1200px) rotateX(${(-this._my * 3.5 * speed).toFixed(2)}deg) rotateY(${(this._mx * 4.5 * speed).toFixed(2)}deg)`;
    }
    this.querySelectorAll('[data-depth]').forEach((el) => {
      const d = Number(el.getAttribute('data-depth')) || 0;
      const x = useMouse ? (this._mx * d * 36 * speed) : (dir === 'horizontal' ? this._sy * d * 70 * speed : 0);
      const y = (useScroll ? this._sy * d * 85 * speed : 0) + (useMouse ? this._my * d * 24 * speed : 0);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
}

// 43. <oz-reveal>
export class OzReveal extends OzoneElement {
  static get observedAttributes() { return ['effect', 'delay', 'duration', 'stagger', 'once', 'threshold']; }

  connectedCallback() {
    super.connectedCallback();
    const threshold = Math.max(0.01, Math.min(0.9, this.numProp('threshold', [], 0.12)));
    const once = !this.hasAttribute('once') || this.boolProp('once');
    if (typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.dataset.visible = 'true';
            if (once && this._io) { this._io.disconnect(); this._io = null; }
          } else if (!once) {
            this.dataset.visible = 'false';
          }
        });
      }, { threshold, rootMargin: '0px 0px -24px 0px' });
      this._io.observe(this);
    } else {
      this.dataset.visible = 'true';
    }
    requestAnimationFrame(() => {
      const r = this.getBoundingClientRect();
      if (r.top < (window.innerHeight || 900) * 0.96 && r.bottom > 0) this.dataset.visible = 'true';
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._io) { this._io.disconnect(); this._io = null; }
  }

  render() {
    this.dataset.effect = this.prop('effect', ['animation'], 'fade-up');
    const stagger = this.numProp('stagger', [], 0);
    this.dataset.stagger = String(stagger > 0);
    this.style.setProperty('--oz-rev-dur', `${this.numProp('duration', [], 680)}ms`);
    this.style.setProperty('--oz-rev-delay', `${this.numProp('delay', [], 0)}ms`);
    if (stagger > 0) {
      this.style.setProperty('--oz-rev-step', `${stagger}ms`);
      Array.from(this.children).forEach((ch, idx) => ch.style.setProperty('--oz-rev-i', String(idx)));
    }
  }
}

// 44. <oz-spotlight>
export class OzSpotlight extends OzoneElement {
  static get observedAttributes() { return ['color', 'size']; }

  connectedCallback() {
    super.connectedCallback();
    this._onMove = (e) => {
      const r = this.getBoundingClientRect();
      this.style.setProperty('--oz-spot-x', `${(e.clientX - r.left).toFixed(1)}px`);
      this.style.setProperty('--oz-spot-y', `${(e.clientY - r.top).toFixed(1)}px`);
      this.style.setProperty('--oz-spot-o', '1');
    };
    this._onLeave = () => this.style.setProperty('--oz-spot-o', '0');
    this.addEventListener('pointermove', this._onMove);
    this.addEventListener('pointerleave', this._onLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointermove', this._onMove);
    this.removeEventListener('pointerleave', this._onLeave);
  }

  render() {
    const map = {
      cyan: 'oklch(0.75 0.18 200 / 0.24)',
      violet: 'oklch(0.70 0.21 285 / 0.24)',
      emerald: 'oklch(0.74 0.17 155 / 0.24)',
      amber: 'oklch(0.80 0.17 80 / 0.24)',
      rose: 'oklch(0.68 0.22 15 / 0.24)'
    };
    const c = this.prop('color', ['glow'], '');
    if (c && map[c]) this.style.setProperty('--oz-spot-color', map[c]);
    const s = this.numProp('size', [], 380);
    this.style.setProperty('--oz-spot-size', `${s}px`);
  }
}

// 45. <oz-drawer>
export class OzDrawer extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'side', 'size', 'open', 'trigger']; }

  connectedCallback() {
    super.connectedCallback();
    this._onKey = (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); };
    document.addEventListener('keydown', this._onKey);
    const trig = this.prop('trigger');
    if (trig) {
      this._trigEl = document.querySelector(trig);
      if (this._trigEl) {
        this._onTrig = () => this.open();
        this._trigEl.addEventListener('click', this._onTrig);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKey);
    if (this._trigEl && this._onTrig) this._trigEl.removeEventListener('click', this._onTrig);
  }

  get isOpen() { return this.boolProp('open'); }
  open() { this.setAttribute('open', ''); sound.click(); this.dispatchEvent(new CustomEvent('oz-open', { bubbles: true })); }
  close() { this.removeAttribute('open'); sound.click(); this.dispatchEvent(new CustomEvent('oz-close', { bubbles: true })); }
  toggle() { if (this.isOpen) this.close(); else this.open(); }

  render() {
    const nodes = this.captureSlotNodes();
    const title = this.prop('heading', ['title'], 'Inspector');
    const sub = this.prop('subtitle');
    const side = ['right', 'left', 'bottom'].includes(this.prop('side')) ? this.prop('side') : 'right';
    const sizes = { sm: '340px', md: '440px', lg: '560px', xl: '720px' };
    const w = sizes[this.prop('size', [], 'md')] || '440px';
    const isOpen = this.isOpen;

    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<div class="oz-drawer-backdrop" data-open="${isOpen}"><aside class="oz-drawer-panel" role="dialog" aria-modal="true" data-side="${side}" style="--oz-drawer-w:${w};"><div class="oz-drawer__head"><div><div class="oz-drawer__title"></div><div class="oz-drawer__subtitle"></div></div><button type="button" class="oz-drawer__close" aria-label="Close drawer">${OZ_SVG.x}</button></div><div class="oz-drawer__body"></div><div class="oz-drawer__foot"></div></aside></div>`;
      const body = this.querySelector('.oz-drawer__body');
      const foot = this.querySelector('.oz-drawer__foot');
      nodes.forEach((n) => {
        if (n.nodeType === 1 && n.getAttribute('slot') === 'footer') foot.appendChild(n);
        else if (!(n.nodeType === 3 && !n.textContent.trim())) body.appendChild(n);
      });
      this.querySelector('.oz-drawer__close').addEventListener('click', () => this.close());
      this.querySelector('.oz-drawer-backdrop').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this.close();
      });
    }

    const bd = this.querySelector('.oz-drawer-backdrop');
    const panel = this.querySelector('.oz-drawer-panel');
    if (bd) bd.setAttribute('data-open', String(isOpen));
    if (panel) {
      panel.setAttribute('data-side', side);
      panel.style.setProperty('--oz-drawer-w', w);
    }
    const tEl = this.querySelector('.oz-drawer__title');
    const sEl = this.querySelector('.oz-drawer__subtitle');
    if (tEl) tEl.textContent = title;
    if (sEl) { sEl.textContent = sub; sEl.style.display = sub ? '' : 'none'; }
  }
}

// 46. <oz-dropdown>
export class OzDropdown extends OzoneElement {
  static get observedAttributes() { return ['label', 'icon', 'variant', 'align', 'items']; }

  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => {
      if (this._open && !this.contains(e.target) && !(this.menuEl && this.menuEl.contains(e.target))) this.close();
    };
    this._reflow = () => { if (this._open) this.close(); };
    document.addEventListener('pointerdown', this._outside);
    window.addEventListener('scroll', this._reflow, true);
    window.addEventListener('resize', this._reflow);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    window.removeEventListener('scroll', this._reflow, true);
    window.removeEventListener('resize', this._reflow);
    if (this.menuEl) this.menuEl.remove();
  }

  render() {
    const label = this.prop('label', [], 'Actions');
    const icon = this.prop('icon');
    const variant = this.prop('variant', ['type'], 'glass');
    const items = this.jsonProp('items', [], [
      { label: 'Duplicate view', value: 'duplicate', icon: 'copy', kbd: '⌘D' },
      { label: 'Export JSON', value: 'export', icon: 'download', kbd: '⌘E' },
      { divider: true },
      { label: 'Delete workspace', value: 'delete', icon: 'x', danger: true }
    ]);
    this._items = Array.isArray(items) ? items : [];
    this._open = false;

    if (this.menuEl) this.menuEl.remove();
    this.innerHTML = `<button type="button" class="oz-btn oz-btn--sm oz-btn--${escapeHTML(variant)}" aria-haspopup="menu" aria-expanded="false">${icon ? `<oz-icon name="${escapeHTML(icon)}" size="14"></oz-icon>` : ''}<span>${escapeHTML(label)}</span>${OZ_SVG.chevron}</button>`;
    this.btnEl = this.querySelector('button');

    this.menuEl = document.createElement('div');
    this.menuEl.className = 'oz-dd__menu';
    this.menuEl.setAttribute('role', 'menu');
    this.menuEl.hidden = true;
    this.menuEl.innerHTML = this._items.map((it, idx) => it.divider
      ? '<div class="oz-dd__div" role="separator"></div>'
      : `<button type="button" class="oz-dd__item${it.danger ? ' oz-dd__item--danger' : ''}" role="menuitem" data-idx="${idx}">${it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="15"></oz-icon>` : ''}<span>${escapeHTML(it.label)}</span>${it.kbd ? `<span class="oz-dd__kbd">${escapeHTML(it.kbd)}</span>` : ''}</button>`
    ).join('');
    document.body.appendChild(this.menuEl);

    this.btnEl.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.btnEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowDown' && !this._open) { e.preventDefault(); this.open(); }
    });
    this.menuEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-idx]');
      if (!btn) return;
      const item = this._items[Number(btn.dataset.idx)];
      if (!item) return;
      sound.click();
      this.close();
      this.dispatchEvent(new CustomEvent('oz-select', { detail: { value: item.value ?? item.label, label: item.label, item }, bubbles: true }));
    });
  }

  open() {
    this._open = true;
    this.btnEl.setAttribute('aria-expanded', 'true');
    this.menuEl.hidden = false;
    const r = this.btnEl.getBoundingClientRect();
    const mw = this.menuEl.offsetWidth || 220;
    const alignRight = this.prop('align') === 'right' || (r.left + mw > window.innerWidth - 12);
    const left = alignRight ? Math.max(12, r.right - mw) : Math.min(r.left, window.innerWidth - mw - 12);
    const below = window.innerHeight - r.bottom;
    this.menuEl.style.left = `${left}px`;
    if (below < 220 && r.top > below) {
      this.menuEl.style.top = 'auto';
      this.menuEl.style.bottom = `${window.innerHeight - r.top + 6}px`;
    } else {
      this.menuEl.style.bottom = 'auto';
      this.menuEl.style.top = `${r.bottom + 6}px`;
    }
  }

  close() {
    this._open = false;
    if (this.btnEl) this.btnEl.setAttribute('aria-expanded', 'false');
    if (this.menuEl) this.menuEl.hidden = true;
  }
}

// 47. <oz-tooltip>
export class OzTooltip extends OzoneElement {
  static get observedAttributes() { return ['text', 'position', 'shortcut']; }

  render() {
    const nodes = this.captureSlotNodes();
    const text = this.prop('text', ['title', 'label'], 'Tooltip');
    const pos = ['top', 'bottom', 'left', 'right'].includes(this.prop('position')) ? this.prop('position') : 'top';
    const kbd = this.prop('shortcut', ['kbd']);
    if (!this._mounted) {
      this._mounted = true;
      const id = 'oz-tip-' + ozUid();
      this.innerHTML = `<span class="oz-tip__trigger" aria-describedby="${id}"></span><span class="oz-tip__bubble" id="${id}" role="tooltip" data-pos="${pos}"></span>`;
      const trig = this.querySelector('.oz-tip__trigger');
      nodes.forEach((n) => trig.appendChild(n));
      const show = () => { this.dataset.open = 'true'; };
      const hide = () => { this.dataset.open = 'false'; };
      this.addEventListener('pointerenter', show);
      this.addEventListener('pointerleave', hide);
      this.addEventListener('focusin', show);
      this.addEventListener('focusout', hide);
    }
    const bubble = this.querySelector('.oz-tip__bubble');
    if (bubble) {
      bubble.setAttribute('data-pos', pos);
      bubble.innerHTML = `<span>${escapeHTML(text)}</span>${kbd ? `<kbd class="oz-tip__kbd">${escapeHTML(kbd)}</kbd>` : ''}`;
    }
  }
}

// 48. <oz-stepper>
export class OzStepper extends OzoneElement {
  static get observedAttributes() { return ['steps', 'active', 'variant', 'clickable']; }

  render() {
    const rawAttr = this.getAttribute('steps');
    let steps = [];
    if (rawAttr && rawAttr.trim().startsWith('[')) {
      steps = this.jsonProp('steps', [], []);
    } else if (rawAttr) {
      steps = rawAttr.split(',').map((s) => ({ title: s.trim() })).filter((s) => s.title);
    } else {
      steps = [
        { title: 'Include CSS & JS', desc: 'Drop in 2 zero-dep files' },
        { title: 'Compose Tags', desc: 'Pick from 49 components' },
        { title: 'Apply Brand DNA', desc: 'Presets, hex or logo' },
        { title: 'Deploy Live', desc: 'Ship to edge or static host' }
      ];
    }
    const active = Math.max(0, Math.min(steps.length - 1, this.numProp('active', [], 0)));
    const vertical = this.prop('variant') === 'vertical';
    const clickable = this.boolProp('clickable');

    this.innerHTML = `<div class="oz-stepper${vertical ? ' oz-stepper--vertical' : ''}" role="list">${steps.map((s, i) => {
      const state = i < active ? 'done' : i === active ? 'active' : 'pending';
      return `<button type="button" class="oz-step" role="listitem" data-idx="${i}" data-state="${state}"${clickable ? '' : ' tabindex="-1"'}><span class="oz-step__dot">${state === 'done' ? OZ_SVG.check : (i + 1)}</span><span><span class="oz-step__title" style="display:block;">${escapeHTML(s.title || s.label || '')}</span>${s.desc ? `<span class="oz-step__desc" style="display:block;">${escapeHTML(s.desc)}</span>` : ''}</span></button>`;
    }).join('')}</div>`;

    if (clickable) {
      this.querySelectorAll('.oz-step').forEach((btn) => btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        sound.click();
        this.setAttribute('active', String(idx));
        this.dispatchEvent(new CustomEvent('oz-step', { detail: { index: idx, step: steps[idx] }, bubbles: true }));
      }));
    }
  }
}

// 49. <oz-kanban>
export class OzKanban extends OzoneElement {
  static get observedAttributes() { return ['columns', 'persist-key', 'addable']; }

  privateData() {
    if (this._cols) return this._cols;
    const key = this.prop('persist-key');
    if (key) {
      try {
        const saved = JSON.parse(localStorage.getItem('oz-kb:' + key) || 'null');
        if (Array.isArray(saved) && saved.length) return (this._cols = saved);
      } catch (e) { /* ignore */ }
    }
    const fromAttr = this.jsonProp('columns', ['data'], null);
    if (Array.isArray(fromAttr) && fromAttr.length) return (this._cols = fromAttr);
    return (this._cols = [
      { id: 'backlog', title: 'Backlog', color: 'cyan', cards: [
        { id: 'k1', title: 'OKLCH Light Mode Contrast Audit', tag: 'Design', priority: 'Medium' },
        { id: 'k2', title: 'Add WebMCP Schema Definitions', tag: 'AI Core', priority: 'High' }
      ]},
      { id: 'progress', title: 'In Progress', color: 'violet', cards: [
        { id: 'k3', title: '120fps Multi-Layer Parallax Engine', tag: 'Motion', priority: 'High' },
        { id: 'k4', title: 'Sidebar Icon-Rail Persistence', tag: 'Layout', priority: 'Low' }
      ]},
      { id: 'done', title: 'Shipped', color: 'emerald', cards: [
        { id: 'k5', title: 'Zero-Dependency Form Controls Pack', tag: 'Forms', priority: 'Medium' }
      ]}
    ]);
  }

  saveCols() {
    const key = this.prop('persist-key');
    if (!key) return;
    try { localStorage.setItem('oz-kb:' + key, JSON.stringify(this._cols)); } catch (e) { /* ignore */ }
  }

  render() {
    const cols = this.privateData();
    const canAdd = !this.hasAttribute('addable') || this.boolProp('addable');
    this.innerHTML = `<div class="oz-kanban">${cols.map((c) => `
      <section class="oz-kanban__col" data-col="${escapeHTML(c.id)}">
        <header class="oz-kanban__head">
          <div class="oz-kanban__title"><span class="oz-kanban__dot oz-kanban__dot--${escapeHTML(c.color || 'cyan')}"></span><span>${escapeHTML(c.title)}</span></div>
          <oz-badge variant="neutral">${(c.cards || []).length}</oz-badge>
        </header>
        <div class="oz-kanban__cards">
          ${(c.cards || []).map((card) => `
            <article class="oz-kanban__card" draggable="true" data-card="${escapeHTML(card.id)}" data-from="${escapeHTML(c.id)}">
              <div class="oz-kanban__card-title">${escapeHTML(card.title)}</div>
              <div class="oz-kanban__meta">
                ${card.tag ? `<span class="oz-kanban__tag">${escapeHTML(card.tag)}</span>` : '<span></span>'}
                ${card.priority ? `<span class="oz-kanban__prio oz-kanban__prio--${escapeHTML(card.priority.toLowerCase())}">${escapeHTML(card.priority)}</span>` : ''}
              </div>
            </article>`).join('')}
        </div>
        ${canAdd ? `<form class="oz-kanban__add" data-add-col="${escapeHTML(c.id)}"><input type="text" placeholder="+ Add task..." /><button type="submit" class="oz-btn oz-btn--sm oz-btn--glass">Add</button></form>` : ''}
      </section>`).join('')}</div>`;

    this.querySelectorAll('.oz-kanban__card').forEach((cardEl) => {
      cardEl.addEventListener('dragstart', () => {
        this._drag = { id: cardEl.dataset.card, from: cardEl.dataset.from };
        cardEl.classList.add('is-dragging');
      });
      cardEl.addEventListener('dragend', () => cardEl.classList.remove('is-dragging'));
    });

    this.querySelectorAll('.oz-kanban__col').forEach((colEl) => {
      colEl.addEventListener('dragover', (e) => { e.preventDefault(); colEl.setAttribute('data-over', 'true'); });
      colEl.addEventListener('dragleave', (e) => { if (!colEl.contains(e.relatedTarget)) colEl.removeAttribute('data-over'); });
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.removeAttribute('data-over');
        if (!this._drag) return;
        const toId = colEl.dataset.col;
        const { id, from } = this._drag;
        this._drag = null;
        if (from === toId) return;
        const srcCol = cols.find((x) => x.id === from);
        const dstCol = cols.find((x) => x.id === toId);
        if (!srcCol || !dstCol) return;
        const idx = srcCol.cards.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const [moved] = srcCol.cards.splice(idx, 1);
        dstCol.cards.push(moved);
        sound.click();
        this.saveCols();
        this.render();
        this.dispatchEvent(new CustomEvent('oz-kanban-move', { detail: { card: moved, fromColumn: from, toColumn: toId }, bubbles: true }));
      });
    });

    this.querySelectorAll('.oz-kanban__add').forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const title = (input.value || '').trim();
      if (!title) return;
      const col = cols.find((x) => x.id === form.dataset.addCol);
      if (!col) return;
      const card = { id: 'k-' + ozUid(), title, tag: 'Task', priority: 'Medium' };
      col.cards.push(card);
      sound.success();
      this.saveCols();
      this.render();
      this.dispatchEvent(new CustomEvent('oz-kanban-add', { detail: { card, column: col.id }, bubbles: true }));
    }));
  }
}

// ============================================================================
// OzoneUI Pack G: Modern Calendar, Color Picker, Number Stepper & OTP Input
// <oz-calendar>, <oz-color-picker>, <oz-number-input>, <oz-otp-input>
// ============================================================================

// 50. <oz-calendar>
export class OzCalendar extends OzFormElement {
  static get observedAttributes() { return ['heading', 'title', 'value', 'start', 'end', 'range', 'min', 'max', 'events']; }
  get value() { return this.boolProp('range') ? `${this._start || ''}..${this._end || ''}` : (this._val || ''); }
  set value(v) { this._val = String(v || ''); this.silentSet('value', this._val); this.paint(); }
  render() {
    const isRange = this.boolProp('range');
    this._val = this.prop('value', [], ozTodayYMD());
    this._start = this.prop('start', [], '');
    this._end = this.prop('end', [], '');
    const base = ozParseYMD(isRange ? this._start : this._val) || ozParseYMD(ozTodayYMD());
    this._vy = base.y; this._vm = base.m;
    this.paint();
  }
  paint() {
    const isRange = this.boolProp('range');
    const title = this.prop('heading', ['title']);
    const events = this.jsonProp('events', [], []);
    const evsHTML = events.length ? `<div class="oz-cal__events">${events.slice(0, 4).map((ev) => `<div class="oz-cal__ev"><span class="oz-cal__dot oz-cal__dot--${escapeHTML(ev.color || 'cyan')}" style="width:8px;height:8px;"></span><span>${escapeHTML(ev.title)}</span><span class="oz-cal__ev-date">${escapeHTML(ozPrettyYMD(ev.date))}</span></div>`).join('')}</div>` : '';
    this.innerHTML = `<div class="oz-cal-card">${title ? `<div style="font-weight:700;font-size:1rem;">${escapeHTML(title)}</div>` : ''}${ozCalMonthHTML(this._vy, this._vm, isRange ? this._start : this._val, isRange ? this._end : '', events, this.prop('min'), this.prop('max'))}${evsHTML}</div>`;
    this.querySelector('[data-cal-prev]').addEventListener('click', () => { this._vm--; if (this._vm < 0) { this._vm = 11; this._vy--; } this.paint(); });
    this.querySelector('[data-cal-next]').addEventListener('click', () => { this._vm++; if (this._vm > 11) { this._vm = 0; this._vy++; } this.paint(); });
    this.querySelector('[data-cal-today]').addEventListener('click', () => { const t = ozParseYMD(ozTodayYMD()); this._vy = t.y; this._vm = t.m; this._val = ozTodayYMD(); this.paint(); });
    this.querySelectorAll('[data-ymd]').forEach((b) => b.addEventListener('click', () => {
      const ymd = b.dataset.ymd;
      sound.click();
      if (isRange) {
        if (!this._start || (this._start && this._end)) { this._start = ymd; this._end = ''; }
        else if (ymd < this._start) { this._end = this._start; this._start = ymd; }
        else this._end = ymd;
        this.silentSet('start', this._start); this.silentSet('end', this._end);
        this.paint();
        if (this._end) this.emit('oz-change', { value: `${this._start}..${this._end}`, start: this._start, end: this._end });
      } else {
        this._val = ymd;
        this.silentSet('value', ymd);
        this.paint();
        this.emit('oz-change', { value: ymd });
      }
    }));
  }
}

// 51. <oz-color-picker>
export class OzColorPicker extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'presets']; }
  get value() { return this._val || '#00b4d8'; }
  set value(v) { this.applyColor(v, false); }
  connectedCallback() {
    super.connectedCallback();
    this._outside = (e) => { if (this._open && !this.contains(e.target) && !(this.popEl && this.popEl.contains(e.target))) this.close(); };
    document.addEventListener('pointerdown', this._outside);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this._outside);
    if (this.popEl) this.popEl.remove();
  }
  render() {
    this._val = this.prop('value', [], '#00b4d8');
    this._open = false;
    const presets = this.prop('presets', [], '#00b4d8,#10b981,#a855f7,#f43f5e,#f59e0b,#3b82f6,#64748b,#ffffff').split(',').map((s) => s.trim()).filter(Boolean);
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    if (this.popEl) this.popEl.remove();
    this.innerHTML = ozFieldHTML(this, `<div class="oz-cp__box"><button type="button" class="oz-cp__swatch" style="background:${escapeHTML(this._val)};" aria-label="Choose swatch"${dis}></button><input type="text" class="oz-cp__hex" size="8" value="${escapeHTML(this._val)}" spellcheck="false" maxlength="9"${dis} /><input type="color" class="oz-cp__native" value="${escapeHTML(/^#[0-9a-fA-F]{6}$/.test(this._val) ? this._val : '#00b4d8')}" aria-label="Color wheel"${dis} /></div>`);
    this.swBtn = this.querySelector('.oz-cp__swatch');
    this.hexIn = this.querySelector('.oz-cp__hex');
    this.natIn = this.querySelector('.oz-cp__native');
    this.popEl = document.createElement('div');
    this.popEl.className = 'oz-cp__pop';
    this.popEl.hidden = true;
    this.popEl.innerHTML = presets.map((c) => `<button type="button" class="oz-cp__cell" data-c="${escapeHTML(c)}" style="background:${escapeHTML(c)};" aria-pressed="${c.toLowerCase() === this._val.toLowerCase()}" aria-label="${escapeHTML(c)}"></button>`).join('');
    document.body.appendChild(this.popEl);

    this.swBtn.addEventListener('click', () => { sound.click(); if (this._open) this.close(); else this.open(); });
    this.popEl.addEventListener('click', (e) => { const c = e.target.closest('[data-c]'); if (c) { this.applyColor(c.dataset.c, true); this.close(); } });
    this.natIn.addEventListener('input', () => this.applyColor(this.natIn.value, true));
    this.hexIn.addEventListener('change', () => {
      const v = this.hexIn.value.trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(v)) this.applyColor(v, true);
    });
  }
  applyColor(v, emit) {
    this._val = v;
    if (this.swBtn) this.swBtn.style.background = v;
    if (this.hexIn) this.hexIn.value = v;
    if (this.natIn && /^#[0-9a-fA-F]{6}$/.test(v)) this.natIn.value = v;
    if (this.popEl) this.popEl.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.c.toLowerCase() === v.toLowerCase()));
    this.silentSet('value', v);
    if (emit) { sound.click(); this.emit('oz-change', { value: v }); }
  }
  open() {
    this._open = true;
    const r = this.swBtn.getBoundingClientRect();
    this.popEl.hidden = false;
    this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - 180))}px`;
    this.popEl.style.top = `${r.bottom + 8}px`;
  }
  close() { this._open = false; if (this.popEl) this.popEl.hidden = true; }
}

// 52. <oz-number-input>
export class OzNumberInput extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'value', 'min', 'max', 'step']; }
  get value() { return Number(this._val ?? this.numProp('value', [], 0)); }
  set value(v) { this.setNum(v, false); }
  render() {
    const min = this.hasAttribute('min') ? this.numProp('min', [], -Infinity) : -Infinity;
    const max = this.hasAttribute('max') ? this.numProp('max', [], Infinity) : Infinity;
    const step = Math.max(0.01, this.numProp('step', [], 1));
    this._min = min; this._max = max; this._step = step;
    this._val = this.numProp('value', [], Math.max(min, Math.min(max, 1)));
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    this.innerHTML = ozFieldHTML(this, `<div class="oz-num"><button type="button" class="oz-num__btn" data-dec aria-label="Decrease"${dis}>−</button><input type="text" inputmode="decimal" class="oz-num__field" size="4" value="${this._val}"${dis} /><button type="button" class="oz-num__btn" data-inc aria-label="Increase"${dis}>+</button></div>`);
    this.field = this.querySelector('input');
    this.querySelector('[data-dec]').addEventListener('click', () => { sound.click(); this.setNum(this._val - this._step, true); });
    this.querySelector('[data-inc]').addEventListener('click', () => { sound.click(); this.setNum(this._val + this._step, true); });
    this.field.addEventListener('change', () => this.setNum(parseFloat(this.field.value), true));
    this.field.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); this.setNum(this._val + this._step, true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); this.setNum(this._val - this._step, true); }
    });
    this.sync();
  }
  setNum(n, emit) {
    if (!Number.isFinite(n)) n = this._val;
    this._val = Math.max(this._min, Math.min(this._max, Number(n.toFixed(4))));
    if (this.field) this.field.value = String(this._val);
    this.silentSet('value', String(this._val));
    this.sync();
    if (emit) this.emit('oz-change', { value: this._val });
  }
  sync() {
    const dec = this.querySelector('[data-dec]'), inc = this.querySelector('[data-inc]');
    if (dec) dec.disabled = this.boolProp('disabled') || this._val <= this._min;
    if (inc) inc.disabled = this.boolProp('disabled') || this._val >= this._max;
  }
}

// 53. <oz-otp-input>
export class OzOtpInput extends OzFormElement {
  static get observedAttributes() { return ['label', 'hint', 'error', 'disabled', 'length', 'value']; }
  get value() { return Array.from(this.querySelectorAll('input')).map((i) => i.value).join(''); }
  render() {
    const len = Math.max(4, Math.min(8, this.numProp('length', [], 6)));
    const init = this.prop('value', [], '');
    const dis = this.boolProp('disabled') ? ' disabled' : '';
    const cells = Array.from({ length: len }, (_, i) => `<input type="text" inputmode="numeric" maxlength="6" class="oz-otp__cell" value="${escapeHTML(init[i] || '')}" aria-label="Digit ${i + 1}"${dis} />`).join('');
    this.innerHTML = ozFieldHTML(this, `<div class="oz-otp">${cells}</div>`);
    const inputs = Array.from(this.querySelectorAll('input'));
    const notify = () => {
      const code = inputs.map((x) => x.value).join('');
      this.silentSet('value', code);
      this.emit('oz-input', { value: code });
      if (code.length === len) { sound.success(); this.emit('oz-complete', { value: code }); this.emit('oz-change', { value: code }); }
    };
    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        const clean = inp.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (clean.length > 1) {
          clean.split('').forEach((ch, off) => { if (inputs[idx + off]) inputs[idx + off].value = ch; });
          inputs[Math.min(idx + clean.length, inputs.length - 1)].focus();
        } else {
          inp.value = clean;
          if (clean && idx < inputs.length - 1) inputs[idx + 1].focus();
        }
        notify();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) { inputs[idx - 1].focus(); inputs[idx - 1].value = ''; notify(); }
      });
      inp.addEventListener('paste', (e) => {
        const text = (e.clipboardData?.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, len);
        if (!text) return;
        e.preventDefault();
        inputs.forEach((x, j) => { x.value = text[j] || ''; });
        inputs[Math.min(text.length, len - 1)].focus();
        notify();
      });
    });
  }
}

// ============================================================================
// OzoneUI Pack H: 12-Col Grid, Mobile App Bar/FAB, AI Chat, Dev & Production UI
// ============================================================================

// Native Form Sync Helper + Global Agent Form Bridge
function syncHiddenField(host, value) {
  const name = host.getAttribute('name');
  if (!name) return;
  let hidden = host.querySelector('input[data-oz-form-val]');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.setAttribute('data-oz-form-val', '');
    host.appendChild(hidden);
  }
  hidden.name = name;
  hidden.value = value == null ? '' : String(value);
}

export function getFormData(root = document) {
  const out = {};
  const scope = root instanceof Element || root instanceof Document ? root : document;
  scope.querySelectorAll('oz-input, oz-select, oz-checkbox, oz-radio-group, oz-textarea, oz-slider, oz-date-picker, oz-combobox, oz-color-picker, oz-number-input, oz-otp-input, oz-switch').forEach((el) => {
    const key = el.getAttribute('name') || el.getAttribute('label') || el.id;
    if (!key) return;
    if ('checked' in el && (el.tagName === 'OZ-CHECKBOX' || el.tagName === 'OZ-SWITCH')) out[key] = el.checked;
    else out[key] = el.value;
  });
  return out;
}

export function fillForm(data = {}, root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  const entries = Object.entries(data);
  scope.querySelectorAll('oz-input, oz-select, oz-checkbox, oz-radio-group, oz-textarea, oz-slider, oz-date-picker, oz-combobox, oz-color-picker, oz-number-input, oz-otp-input, oz-switch').forEach((el) => {
    const keys = [el.getAttribute('name'), el.getAttribute('label'), el.id].filter(Boolean).map((s) => s.toLowerCase());
    const match = entries.find(([k]) => keys.includes(k.toLowerCase()));
    if (!match) return;
    const val = match[1];
    if (el.tagName === 'OZ-CHECKBOX' || el.tagName === 'OZ-SWITCH') el.checked = Boolean(val);
    else if ('value' in el) el.value = val;
    el.dispatchEvent(new CustomEvent('oz-change', { detail: { value: val }, bubbles: true }));
  });
  return getFormData(scope);
}

// 54. <oz-grid>
export class OzGrid extends OzoneElement {
  static get observedAttributes() { return ['cols', 'gap', 'min', 'align']; }
  render() {
    this.style.setProperty('--oz-grid-cols', this.prop('cols', [], '12'));
    const gap = this.prop('gap');
    if (gap) this.style.setProperty('--oz-grid-gap', /^\d+$/.test(gap) ? gap + 'px' : gap);
    const min = this.prop('min');
    if (min) this.style.setProperty('--oz-grid-min', /^\d+$/.test(min) ? min + 'px' : min);
    const align = this.prop('align');
    if (align) this.style.setProperty('--oz-grid-align', align);
  }
}

// 55. <oz-col>
export class OzCol extends OzoneElement {
  static get observedAttributes() { return ['span', 'span-md', 'span-sm']; }
  render() {
    this.style.setProperty('--oz-span', this.prop('span', [], '12'));
    const md = this.prop('span-md'); if (md) this.style.setProperty('--oz-span-md', md);
    const sm = this.prop('span-sm'); if (sm) this.style.setProperty('--oz-span-sm', sm);
  }
}

// 56. <oz-bottom-nav>
export class OzBottomNav extends OzoneElement {
  static get observedAttributes() { return ['items', 'active', 'variant', 'position']; }
  render() {
    const items = this.jsonProp('items', [], [
      { id: 'home', label: 'Home', icon: 'layout' },
      { id: 'explore', label: 'Explore', icon: 'sparkles' },
      { id: 'alerts', label: 'Alerts', icon: 'activity', badge: '3' },
      { id: 'profile', label: 'Profile', icon: 'user' }
    ]);
    const active = this.prop('active', [], this._active || (items[0] && (items[0].id || items[0].label)) || '');
    this._active = active;
    this.innerHTML = `<nav class="oz-bnav" role="tablist" aria-label="Bottom Navigation">${items.map((it) => {
      const id = String(it.id || it.label);
      const isOn = id === active;
      return `<button type="button" class="oz-bnav__btn${isOn ? ' is-active' : ''}" role="tab" aria-selected="${isOn}" data-id="${escapeHTML(id)}">${it.badge ? `<span class="oz-bnav__badge">${escapeHTML(it.badge)}</span>` : ''}<oz-icon name="${escapeHTML(it.icon || 'diamond')}" size="20"></oz-icon><span>${escapeHTML(it.label)}</span></button>`;
    }).join('')}</nav>`;
    this.querySelectorAll('.oz-bnav__btn').forEach((b) => b.addEventListener('click', () => {
      this._active = b.dataset.id;
      this.setAttribute('active', b.dataset.id);
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-navigate', { detail: { id: b.dataset.id }, bubbles: true }));
    }));
  }
}

// 57. <oz-fab>
export class OzFab extends OzoneElement {
  static get observedAttributes() { return ['icon', 'label', 'items', 'position']; }
  render() {
    const icon = this.prop('icon', [], 'plus');
    const label = this.prop('label');
    const items = this.jsonProp('items', [], []);
    const hasDial = Array.isArray(items) && items.length > 0;
    this._open = false;
    this.innerHTML = `<div class="oz-fab__wrap">${hasDial ? `<div class="oz-fab__dial" data-open="false">${items.map((it, idx) => `<button type="button" class="oz-fab__action" data-idx="${idx}">${it.icon ? `<oz-icon name="${escapeHTML(it.icon)}" size="16"></oz-icon>` : ''}<span>${escapeHTML(it.label)}</span></button>`).join('')}</div>` : ''}<button type="button" class="oz-fab__btn${label ? '' : ' oz-fab__btn--icon'}" aria-expanded="false" aria-label="${escapeHTML(label || 'Quick Actions')}"><oz-icon name="${escapeHTML(icon)}" size="22"></oz-icon>${label ? `<span>${escapeHTML(label)}</span>` : ''}</button></div>`;
    const btn = this.querySelector('.oz-fab__btn');
    const dial = this.querySelector('.oz-fab__dial');
    btn.addEventListener('click', () => {
      sound.click();
      if (hasDial && dial) {
        this._open = !this._open;
        dial.setAttribute('data-open', String(this._open));
        btn.setAttribute('aria-expanded', String(this._open));
      } else {
        this.dispatchEvent(new CustomEvent('oz-action', { detail: { action: 'fab' }, bubbles: true }));
      }
    });
    if (dial) {
      dial.querySelectorAll('.oz-fab__action').forEach((act) => act.addEventListener('click', () => {
        const it = items[Number(act.dataset.idx)];
        this._open = false;
        dial.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
        sound.click();
        this.dispatchEvent(new CustomEvent('oz-fab-action', { detail: { id: it.id || it.label, item: it }, bubbles: true }));
      }));
    }
  }
}

// 58. <oz-ai-chat>
export class OzAiChat extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'model', 'models', 'suggestions', 'placeholder', 'messages']; }
  connectedCallback() { super.connectedCallback(); }
  addMessage(role, text) {
    this._msgs.push({ role, text });
    this.paintFeed();
  }
  async streamReply(fullText) {
    const idx = this._msgs.push({ role: 'assistant', text: '' }) - 1;
    const words = String(fullText).split(' ');
    for (let i = 0; i < words.length; i++) {
      this._msgs[idx].text += (i ? ' ' : '') + words[i];
      this.paintFeed();
      await new Promise((r) => setTimeout(r, 22));
    }
  }
  render() {
    const title = this.prop('heading', ['title'], 'Ozone AI Assistant');
    const models = this.prop('models', [], 'Gemini 2.5 Pro,Claude Sonnet,GPT-4o').split(',').map((s) => s.trim()).filter(Boolean);
    this._model = this.prop('model', [], models[0] || 'Gemini 2.5 Pro');
    const sugs = this.prop('suggestions', [], 'Build a 12-col dashboard,Suggest brand palette,Generate API table').split(',').map((s) => s.trim()).filter(Boolean);
    this._msgs = this.jsonProp('messages', [], [
      { role: 'assistant', text: 'Ready. Ask me to compose OzoneUI tags, pick OKLCH colors, or scaffold a responsive layout.' }
    ]);
    this.innerHTML = `<div class="oz-chat"><header class="oz-chat__head"><div class="oz-chat__brand"><oz-icon name="sparkles" size="18" glow></oz-icon><span>${escapeHTML(title)}</span></div><select class="oz-chat__model" aria-label="AI Model">${models.map((m) => `<option${m === this._model ? ' selected' : ''}>${escapeHTML(m)}</option>`).join('')}</select></header><div class="oz-chat__feed" role="log" aria-live="polite"></div>${sugs.length ? `<div class="oz-chat__chips">${sugs.map((s) => `<button type="button" class="oz-chat__chip">${escapeHTML(s)}</button>`).join('')}</div>` : ''}<form class="oz-chat__form"><input type="text" class="oz-chat__input" placeholder="${escapeHTML(this.prop('placeholder', [], 'Ask AI to build UI...'))}" /><button type="submit" class="oz-btn oz-btn--sm oz-btn--glow"><oz-icon name="send" size="14"></oz-icon> Send</button></form></div>`;
    this.feedEl = this.querySelector('.oz-chat__feed');
    this.inputEl = this.querySelector('.oz-chat__input');
    this.querySelector('.oz-chat__model').addEventListener('change', (e) => { this._model = e.target.value; });
    this.querySelectorAll('.oz-chat__chip').forEach((c) => c.addEventListener('click', () => this.submitPrompt(c.textContent.trim())));
    this.querySelector('.oz-chat__form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitPrompt(this.inputEl.value);
    });
    this.paintFeed();
  }
  paintFeed() {
    if (!this.feedEl) return;
    this.feedEl.innerHTML = this._msgs.map((m) => `<div class="oz-chat__msg oz-chat__msg--${m.role === 'user' ? 'user' : 'ai'}"><span class="oz-chat__avatar"><oz-icon name="${m.role === 'user' ? 'user' : 'sparkles'}" size="15"></oz-icon></span><div class="oz-chat__bubble">${escapeHTML(m.text || '...')}</div></div>`).join('');
    this.feedEl.scrollTop = this.feedEl.scrollHeight;
  }
  submitPrompt(raw) {
    const prompt = String(raw || '').trim();
    if (!prompt) return;
    this.inputEl.value = '';
    this.addMessage('user', prompt);
    sound.click();
    const ev = new CustomEvent('oz-send', { detail: { prompt, model: this._model, chat: this }, bubbles: true, cancelable: true });
    this.dispatchEvent(ev);
    if (!ev.defaultPrevented) {
      this.streamReply(`Generated <oz-grid cols="12"> layout & OKLCH tokens via ${this._model} for "${prompt}". Ready in 1 tag with zero build steps.`);
    }
  }
}

// 59. <oz-code-block>
export class OzCodeBlock extends OzoneElement {
  static get observedAttributes() { return ['title', 'lang', 'code', 'line-numbers']; }
  render() {
    if (this._code === undefined) {
      this._code = this.getAttribute('code') ?? this.captureSlotNodes().map((n) => n.textContent).join('').trim();
    }
    const code = this.getAttribute('code') ?? this._code ?? '';
    const title = this.prop('title', ['file'], 'snippet.html');
    const lang = this.prop('lang', ['language'], 'html');
    const nums = this.boolProp('line-numbers');
    const lines = String(code).split(/\r?\n/).map((l) => `<span class="oz-code__line">${escapeHTML(l || ' ')}</span>`).join('');
    this.innerHTML = `<div class="oz-code${nums ? ' oz-code--nums' : ''}"><header class="oz-code__head"><div class="oz-code__meta"><oz-badge variant="cyan">${escapeHTML(lang)}</oz-badge><span>${escapeHTML(title)}</span></div><button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-copy><oz-icon name="copy" size="13"></oz-icon> <span>Copy</span></button></header><pre class="oz-code__pre"><code>${lines}</code></pre></div>`;
    const btn = this.querySelector('[data-copy]');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard?.writeText(code); } catch {}
      sound.success();
      const sp = btn.querySelector('span');
      if (sp) { sp.textContent = 'Copied'; setTimeout(() => { sp.textContent = 'Copy'; }, 1400); }
    });
  }
}

// 60. <oz-split-pane>
export class OzSplitPane extends OzoneElement {
  static get observedAttributes() { return ['ratio']; }
  render() {
    const nodes = this.captureSlotNodes().filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
    if (!this._mounted) {
      this._mounted = true;
      const ratio = Math.max(15, Math.min(85, this.numProp('ratio', [], 40)));
      this.innerHTML = `<div class="oz-split" style="--oz-split-a:${ratio}%;"><div class="oz-split__pane" data-pane="a"></div><div class="oz-split__handle" role="separator" aria-orientation="vertical" title="Drag to resize"></div><div class="oz-split__pane" data-pane="b"></div></div>`;
      if (nodes[0]) this.querySelector('[data-pane="a"]').appendChild(nodes[0]);
      nodes.slice(1).forEach((n) => this.querySelector('[data-pane="b"]').appendChild(n));
      const box = this.querySelector('.oz-split');
      const handle = this.querySelector('.oz-split__handle');
      let dragging = false;
      handle.addEventListener('pointerdown', (e) => { dragging = true; handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const r = box.getBoundingClientRect();
        const pct = Math.max(18, Math.min(82, ((e.clientX - r.left) / (r.width || 1)) * 100));
        box.style.setProperty('--oz-split-a', pct.toFixed(1) + '%');
      });
      const stop = () => { dragging = false; };
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    }
  }
}

// 61. <oz-tree>
export class OzTree extends OzoneElement {
  static get observedAttributes() { return ['items', 'active']; }
  render() {
    const items = this.jsonProp('items', [], [
      { id: 'src', label: 'src', open: true, children: [
        { id: 'styles', label: 'styles/ozone.css' },
        { id: 'forms', label: 'components/shell-forms.ts' },
        { id: 'ai', label: 'ai/renderer.ts' }
      ]},
      { id: 'dist', label: 'dist', open: true, children: [
        { id: 'dcss', label: 'ozone.css' },
        { id: 'djs', label: 'ozone.js' }
      ]},
      { id: 'llms', label: 'llms.txt' }
    ]);
    if (!this._open) {
      this._open = new Set();
      const seed = (arr) => arr.forEach((n) => { if (n.open) this._open.add(n.id || n.label); if (n.children) seed(n.children); });
      seed(items);
    }
    this._active = this.prop('active', [], this._active || '');
    const drawNode = (n) => {
      const id = String(n.id || n.label);
      const has = Array.isArray(n.children) && n.children.length > 0;
      const open = has && this._open.has(id);
      return `<div><button type="button" class="oz-tree__row${this._active === id ? ' is-active' : ''}" data-id="${escapeHTML(id)}" data-has="${has}" data-label="${escapeHTML(n.label)}"><oz-icon name="${has ? (open ? 'chevron-down' : 'arrow-right') : (n.icon || 'code')}" size="14"></oz-icon><span>${escapeHTML(n.label)}</span></button>${has ? `<div class="oz-tree__kids"${open ? '' : ' hidden'}>${n.children.map(drawNode).join('')}</div>` : ''}</div>`;
    };
    this.innerHTML = `<div class="oz-tree" role="tree">${items.map(drawNode).join('')}</div>`;
    this.querySelectorAll('.oz-tree__row').forEach((r) => r.addEventListener('click', () => {
      const id = r.dataset.id;
      if (r.dataset.has === 'true') { if (this._open.has(id)) this._open.delete(id); else this._open.add(id); }
      this._active = id;
      sound.click();
      this.render();
      this.dispatchEvent(new CustomEvent('oz-select', { detail: { id, label: r.dataset.label }, bubbles: true }));
    }));
  }
}

// 62. <oz-hover-card>
export class OzHoverCard extends OzoneElement {
  static get observedAttributes() { return ['heading', 'title', 'subtitle', 'badge', 'meta']; }
  connectedCallback() { super.connectedCallback(); }
  disconnectedCallback() { super.disconnectedCallback(); if (this.popEl) this.popEl.remove(); }
  render() {
    const nodes = this.captureSlotNodes();
    if (!this._mounted) {
      this._mounted = true;
      this.innerHTML = `<span class="oz-hc__trig" tabindex="0"></span>`;
      const tr = this.querySelector('.oz-hc__trig');
      nodes.forEach((n) => tr.appendChild(n));
      this.popEl = document.createElement('div');
      this.popEl.className = 'oz-hc__pop';
      this.popEl.hidden = true;
      document.body.appendChild(this.popEl);
      const show = () => {
        clearTimeout(this._t);
        const r = tr.getBoundingClientRect();
        this.popEl.hidden = false;
        const pw = this.popEl.offsetWidth || 280;
        this.popEl.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - pw - 12))}px`;
        this.popEl.style.top = `${r.bottom + 10}px`;
      };
      const hide = () => { this._t = setTimeout(() => { if (this.popEl) this.popEl.hidden = true; }, 140); };
      this.addEventListener('pointerenter', show);
      this.addEventListener('pointerleave', hide);
      this.addEventListener('focusin', show);
      this.addEventListener('focusout', hide);
      this.popEl.addEventListener('pointerenter', () => clearTimeout(this._t));
      this.popEl.addEventListener('pointerleave', hide);
    }
    const title = this.prop('heading', ['title'], 'Elena Vance');
    const sub = this.prop('subtitle', [], 'Principal Systems Architect • Aether AI');
    const badge = this.prop('badge');
    const meta = this.prop('meta');
    if (this.popEl) {
      this.popEl.innerHTML = `<div class="oz-between" style="gap:8px;"><div class="oz-row" style="gap:10px;"><oz-avatar name="${escapeHTML(title)}" size="36" status="online"></oz-avatar><div><div style="font-weight:700;font-size:0.92rem;">${escapeHTML(title)}</div><div class="oz-text-xs oz-muted">${escapeHTML(sub)}</div></div></div>${badge ? `<oz-badge variant="cyan">${escapeHTML(badge)}</oz-badge>` : ''}</div>${meta ? `<div class="oz-text-xs oz-muted">${escapeHTML(meta)}</div>` : ''}`;
    }
  }
}

// 63. <oz-pagination>
export class OzPagination extends OzoneElement {
  static get observedAttributes() { return ['page', 'total', 'page-size']; }
  render() {
    const total = Math.max(1, this.numProp('total', [], 120));
    const size = Math.max(1, this.numProp('page-size', [], 10));
    const pages = Math.max(1, Math.ceil(total / size));
    const page = Math.max(1, Math.min(pages, this.numProp('page', [], 1)));
    const start = (page - 1) * size + 1, end = Math.min(total, page * size);
    const nums = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    this.innerHTML = `<div class="oz-pagebar"><span class="oz-text-xs oz-muted">Showing <strong>${start}–${end}</strong> of <strong>${total}</strong></span><nav class="oz-pages" aria-label="Pagination"><button type="button" class="oz-page" data-p="${page - 1}"${page <= 1 ? ' disabled' : ''}>&#8249;</button>${nums.map((n) => n === '...' ? `<span class="oz-muted" style="padding:0 4px;">…</span>` : `<button type="button" class="oz-page${n === page ? ' is-active' : ''}" data-p="${n}" aria-current="${n === page ? 'page' : 'false'}">${n}</button>`).join('')}<button type="button" class="oz-page" data-p="${page + 1}"${page >= pages ? ' disabled' : ''}>&#8250;</button></nav></div>`;
    this.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = Number(b.dataset.p);
      sound.click();
      this.setAttribute('page', String(p));
      this.dispatchEvent(new CustomEvent('oz-page', { detail: { page: p }, bubbles: true }));
    }));
  }
}

// 64. <oz-skeleton>
export class OzSkeleton extends OzoneElement {
  static get observedAttributes() { return ['variant', 'lines']; }
  render() {
    const v = this.prop('variant', ['type'], 'card');
    const lines = Math.max(1, Math.min(8, this.numProp('lines', [], 3)));
    if (v === 'stat') {
      this.innerHTML = `<div class="oz-skel"><div class="oz-skel__bar" style="width:45%;"></div><div class="oz-skel__bar" style="width:70%;height:26px;margin-top:6px;"></div><div class="oz-skel__bar" style="width:35%;"></div></div>`;
      return;
    }
    const bars = Array.from({ length: lines }, (_, i) => `<div class="oz-skel__bar" style="width:${i === lines - 1 ? '62%' : '100%'};"></div>`).join('');
    this.innerHTML = `<div class="oz-skel">${v === 'avatar' ? `<div style="display:flex;align-items:center;gap:12px;"><div class="oz-skel__bar" style="width:40px;height:40px;border-radius:50%;flex:none;"></div><div class="oz-skel__bar" style="width:55%;"></div></div>` : ''}${bars}</div>`;
  }
}

// 65. <oz-empty-state>
export class OzEmptyState extends OzoneElement {
  static get observedAttributes() { return ['icon', 'heading', 'title', 'description', 'cta']; }
  render() {
    const icon = this.prop('icon', [], 'box');
    const title = this.prop('heading', ['title'], 'Nothing here yet');
    const desc = this.prop('description', ['subtitle'], 'Create your first item or adjust active filters to see results.');
    const cta = this.prop('cta');
    this.innerHTML = `<div class="oz-empty"><div class="oz-empty__icon"><oz-icon name="${escapeHTML(icon)}" size="24"></oz-icon></div><div class="oz-empty__title">${escapeHTML(title)}</div><div class="oz-empty__desc">${escapeHTML(desc)}</div>${cta ? `<oz-button variant="glow" size="sm" id="empty-cta">${escapeHTML(cta)}</oz-button>` : ''}</div>`;
    this.querySelector('#empty-cta')?.addEventListener('click', () => {
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-action', { detail: { action: 'empty-cta' }, bubbles: true }));
    });
  }
}

// 66. <oz-cookie-consent> (EU GDPR / ePrivacy Planet49 compliant, zero dark patterns)
export const gdpr = {
  key: 'oz-gdpr-consent',
  getConsent() {
    try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch { return null; }
  },
  setConsent(prefs) {
    const val = { essential: true, preferences: !!prefs.preferences, analytics: !!prefs.analytics, strict: !!prefs.strict, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(this.key, JSON.stringify(val)); } catch {}
    if (val.strict) document.documentElement.dataset.ozGdpr = 'strict';
    else delete document.documentElement.dataset.ozGdpr;
    window.dispatchEvent(new CustomEvent('oz-consent', { detail: val }));
    return val;
  },
  clearStorage() {
    const removed = [];
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('oz-')) { localStorage.removeItem(k); removed.push(k); }
      }
    } catch {}
    delete document.documentElement.dataset.ozGdpr;
    window.dispatchEvent(new CustomEvent('oz-consent', { detail: { cleared: removed } }));
    return removed;
  },
  exportData() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('oz-')) out[k] = localStorage.getItem(k);
      }
    } catch {}
    return out;
  }
};

export class OzCookieConsent extends OzoneElement {
  static get observedAttributes() { return ['heading', 'description', 'policy-url', 'position', 'open']; }
  open() { this.setAttribute('open', ''); this.paint(); }
  close() { this.removeAttribute('open'); this.paint(); }
  render() {
    this.paint();
  }
  paint() {
    const existing = gdpr.getConsent();
    const forceOpen = this.boolProp('open');
    const visible = forceOpen || !existing;
    const heading = this.prop('heading', ['title'], 'Your Privacy & EU Cookies');
    const desc = this.prop('description', [], 'OzoneUI loads 0 third-party fonts or trackers. Functional preferences are stored locally only with your consent.');
    const policy = this.prop('policy-url', [], 'legal.html');
    this.innerHTML = `<aside class="oz-cc-banner" role="dialog" aria-label="${escapeHTML(heading)}"${visible ? '' : ' hidden'}><div class="oz-cc__head"><div class="oz-cc__title"><oz-icon name="shield" size="18" glow></oz-icon><span>${escapeHTML(heading)}</span></div><oz-badge variant="emerald">GDPR</oz-badge></div><p class="oz-cc__desc">${escapeHTML(desc)} <a href="${escapeHTML(policy)}" style="color:var(--oz-primary);text-decoration:underline;">Privacy &amp; EU Legal</a></p><div class="oz-cc__prefs" hidden><oz-checkbox label="Essential &amp; Security State" description="Always active for theme &amp; accessibility safety." checked disabled></oz-checkbox><oz-checkbox id="cc-pref-ui" label="Theme DNA &amp; Layout Memory" description="Remembers chosen palette, mode, and sidebar state." checked></oz-checkbox><oz-checkbox id="cc-pref-strict" label="Strict Zero-Network Mode" description="Blocks optional external Iconify icon CDN fetches."></oz-checkbox></div><div class="oz-cc__actions"><button type="button" class="oz-btn oz-btn--sm oz-btn--glass" data-gdpr="essential">Essential Only</button><button type="button" class="oz-btn oz-btn--sm oz-btn--ghost" data-gdpr="prefs">Customize</button><button type="button" class="oz-btn oz-btn--sm oz-btn--primary" data-gdpr="all">Accept All</button></div></aside>`;
    const banner = this.querySelector('.oz-cc-banner');
    const prefsBox = this.querySelector('.oz-cc__prefs');
    const save = (cfg) => {
      const saved = gdpr.setConsent(cfg);
      this.removeAttribute('open');
      if (banner) banner.hidden = true;
      sound.click();
      this.dispatchEvent(new CustomEvent('oz-consent', { detail: saved, bubbles: true }));
    };
    this.querySelector('[data-gdpr="essential"]').addEventListener('click', () => save({ preferences: false, analytics: false, strict: true }));
    this.querySelector('[data-gdpr="all"]').addEventListener('click', () => save({ preferences: true, analytics: true, strict: false }));
    this.querySelector('[data-gdpr="prefs"]').addEventListener('click', (e) => {
      if (prefsBox.hidden) {
        prefsBox.hidden = false;
        e.currentTarget.textContent = 'Save Choices';
      } else {
        const uiPref = this.querySelector('#cc-pref-ui')?.checked ?? true;
        const strictPref = this.querySelector('#cc-pref-strict')?.checked ?? false;
        save({ preferences: uiPref, analytics: false, strict: strictPref });
      }
    });
  }
}
