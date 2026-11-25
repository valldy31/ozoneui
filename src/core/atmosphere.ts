// ============================================================================
// OzoneUI Atmospheric 120fps Specular Light, 3D Tilt & Auto-FPS Governor
// ============================================================================

let initialized = false;

export function initAtmosphere() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Respect prefers-reduced-motion automatically
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (media?.matches) {
    document.documentElement.dataset.ozPerf = 'eco';
  }

  let rafPending = false;
  let lastX = 0;
  let lastY = 0;
  let activeEl: HTMLElement | null = null;

  const updatePointer = () => {
    rafPending = false;
    if (!activeEl) return;
    if (document.documentElement.dataset.ozPerf === 'eco') return;

    const rect = activeEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = lastX - rect.left;
    const y = lastY - rect.top;
    activeEl.style.setProperty('--oz-mouse-x', `${x.toFixed(1)}px`);
    activeEl.style.setProperty('--oz-mouse-y', `${y.toFixed(1)}px`);

    const flatFlavour = ['minimal', 'shadcn', 'brutalist', 'enterprise', 'terminal', 'editorial'].includes(document.documentElement.dataset.ozFlavour || '');
    if (
      activeEl.hasAttribute('tilt') &&
      !activeEl.hasAttribute('no-tilt') &&
      document.documentElement.dataset.ozMode !== 'precision' &&
      !flatFlavour &&
      !window.matchMedia?.('(hover: none)')?.matches
    ) {
      const nx = (x / rect.width) - 0.5;
      const ny = (y / rect.height) - 0.5;
      const maxTilt = 5.5;
      activeEl.style.setProperty('--oz-tilt-x', `${(-ny * maxTilt).toFixed(2)}deg`);
      activeEl.style.setProperty('--oz-tilt-y', `${(nx * maxTilt).toFixed(2)}deg`);
    } else if (activeEl.hasAttribute('no-tilt') || document.documentElement.dataset.ozMode === 'precision' || flatFlavour) {
      activeEl.style.setProperty('--oz-tilt-x', '0deg');
      activeEl.style.setProperty('--oz-tilt-y', '0deg');
    }
  };

  window.addEventListener('pointermove', (e: PointerEvent) => {
    const target = (e.target as HTMLElement | null)?.closest?.(
      'oz-card, oz-stat, oz-chart, oz-pricing, oz-product-card, oz-post'
    ) as HTMLElement | null;

    if (activeEl && activeEl !== target && activeEl.hasAttribute('tilt')) {
      activeEl.style.setProperty('--oz-tilt-x', '0deg');
      activeEl.style.setProperty('--oz-tilt-y', '0deg');
    }

    activeEl = target;
    lastX = e.clientX;
    lastY = e.clientY;

    if (activeEl && !rafPending) {
      rafPending = true;
      requestAnimationFrame(updatePointer);
    }
  }, { passive: true });

  // Lightweight Auto-FPS Governor (checks frame budget without constant CPU overhead)
  let frames = 0;
  let windowStart = performance.now();
  let slowWindows = 0;

  const sampleFps = (now: number) => {
    frames++;
    const elapsed = now - windowStart;
    if (elapsed >= 2000) {
      const fps = (frames * 1000) / elapsed;
      if (fps > 0 && fps < 32 && !document.hidden) {
        slowWindows++;
        if (slowWindows >= 3 && !document.documentElement.dataset.ozPerf) {
          document.documentElement.dataset.ozPerf = 'eco';
        }
      } else {
        slowWindows = Math.max(0, slowWindows - 1);
      }
      frames = 0;
      windowStart = now;
    }
    if (slowWindows < 3) {
      requestAnimationFrame(sampleFps);
    }
  };
  requestAnimationFrame(sampleFps);
}
