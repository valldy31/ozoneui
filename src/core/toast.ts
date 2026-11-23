// ============================================================================
// OzoneUI Stackable Glass Toast System
// ============================================================================
import { sound } from './sound.ts';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'neutral';
  duration?: number;
}

function getStack(): HTMLElement {
  let stack = document.getElementById('oz-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'oz-toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

export function toast(opts: ToastOptions | string) {
  const cfg: ToastOptions = typeof opts === 'string' ? { message: opts } : opts;
  const variant = cfg.variant || 'cyan';
  const duration = cfg.duration ?? 3400;
  const stack = getStack();

  const item = document.createElement('div');
  item.className = 'oz-toast-item';

  const dotColor: Record<string, string> = {
    cyan: 'var(--oz-cyan)',
    violet: 'var(--oz-violet)',
    emerald: 'var(--oz-emerald)',
    amber: 'var(--oz-amber)',
    rose: 'var(--oz-rose)',
    neutral: 'var(--oz-text-muted)'
  };

  item.innerHTML = `
    <span style="width:9px;height:9px;border-radius:50%;margin-top:6px;flex-shrink:0;background:${dotColor[variant] || dotColor.cyan};box-shadow:0 0 10px ${dotColor[variant] || dotColor.cyan};"></span>
    <div style="flex:1;min-width:0;">
      ${cfg.title ? `<div style="font-weight:600;font-size:0.86rem;margin-bottom:2px;"></div>` : ''}
      <div class="oz-toast-msg" style="font-size:0.82rem;color:var(--oz-text-muted);"></div>
    </div>
    <button aria-label="Close" style="background:none;border:none;color:var(--oz-text-subtle);cursor:pointer;font-size:1rem;line-height:1;">&times;</button>
  `;

  if (cfg.title) {
    const t = item.querySelector('div > div:first-child') as HTMLElement;
    if (t) t.textContent = cfg.title;
  }
  const msgEl = item.querySelector('.oz-toast-msg') as HTMLElement;
  if (msgEl) msgEl.textContent = cfg.message;

  const remove = () => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    item.style.transition = 'all 180ms ease';
    setTimeout(() => item.remove(), 190);
  };

  item.querySelector('button')?.addEventListener('click', remove);
  stack.appendChild(item);

  if (variant === 'emerald') sound.success();
  else sound.open();

  if (duration > 0) {
    setTimeout(remove, duration);
  }
}
