// ============================================================================
// OzoneUI Bi-Directional AI Ghost Cursor & Co-Pilot Presence
// ============================================================================
import { sound } from './sound.ts';
import { toast } from './toast.ts';

export interface AgentMoveOptions {
  label?: string;
  action?: 'click' | 'focus' | 'highlight';
  holdMs?: number;
}

class OzoneAgentCoPilot {
  private cursorEl: HTMLElement | null = null;
  private running = false;

  private ensureCursor(): HTMLElement {
    if (!this.cursorEl || !document.body.contains(this.cursorEl)) {
      const el = document.createElement('div');
      el.id = 'oz-agent-cursor';
      el.innerHTML = `
        <div class="oz-agent-pointer"></div>
        <div class="oz-agent-pill">AI Co-Pilot</div>
      `;
      document.body.appendChild(el);
      this.cursorEl = el;
    }
    return this.cursorEl;
  }

  async moveTo(target: string | Element, opts: AgentMoveOptions = {}): Promise<boolean> {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || !(el instanceof HTMLElement)) return false;

    const cursor = this.ensureCursor();
    const pill = cursor.querySelector('.oz-agent-pill') as HTMLElement;
    if (pill) pill.textContent = opts.label || 'AI Co-Pilot';

    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    await new Promise((r) => setTimeout(r, 240));

    const rect = el.getBoundingClientRect();
    const x = Math.max(12, Math.min(window.innerWidth - 40, rect.left + rect.width * 0.5));
    const y = Math.max(12, Math.min(window.innerHeight - 40, rect.top + rect.height * 0.5));

    cursor.dataset.active = 'true';
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    sound.agent();

    await new Promise((r) => setTimeout(r, 560));
    el.classList.add('oz-agent-highlight');

    if (opts.action === 'click') {
      const clickable = (el.querySelector('button, a, input, [role="tab"]') as HTMLElement) || el;
      clickable.click();
    } else if (opts.action === 'focus') {
      const input = (el.querySelector('input, textarea') as HTMLElement) || el;
      input.focus();
    }

    await new Promise((r) => setTimeout(r, opts.holdMs ?? 650));
    el.classList.remove('oz-agent-highlight');
    return true;
  }

  hide() {
    if (this.cursorEl) {
      this.cursorEl.dataset.active = 'false';
    }
  }

  async runDemoWorkflow() {
    if (this.running) return;
    this.running = true;

    toast({ title: 'AI Co-Pilot Active', message: 'Demonstrating live autonomous UI navigation...', variant: 'violet' });

    try {
      const steps: Array<{ selector: string; label: string; action: 'click' | 'highlight' }> = [
        { selector: '[data-domain-btn="admin"]', label: 'AI: Opening Admin BI', action: 'click' },
        { selector: 'oz-chart', label: 'AI: Inspecting Revenue Chart', action: 'highlight' },
        { selector: 'oz-smart-view [data-view="cards"]', label: 'AI: Morphing JSON → Bento Cards', action: 'click' },
        { selector: '[data-domain-btn="marketplace"]', label: 'AI: Browsing Marketplace', action: 'click' },
        { selector: 'oz-product-card', label: 'AI: Evaluating Top Asset', action: 'highlight' },
        { selector: '[data-domain-btn="ai"]', label: 'AI: Entering Generative UI Lab', action: 'click' }
      ];

      for (const s of steps) {
        const el = document.querySelector(s.selector);
        if (el) {
          await this.moveTo(el, { label: s.label, action: s.action, holdMs: 580 });
        }
      }

      toast({ title: 'AI Workflow Complete', message: 'Every OzoneUI domain is agent-navigable.', variant: 'emerald' });
    } finally {
      this.hide();
      this.running = false;
    }
  }
}

export const agent = new OzoneAgentCoPilot();
