// ============================================================================
// OzoneUI v1.0.0 — Main Entry Point
// Registers all 23 Quad-Domain & AI-Native Web Components + Global Ozone API
// ============================================================================
import './styles/ozone.css';
import { initAtmosphere } from './core/atmosphere.ts';
import { dna } from './core/dna.ts';
import { registerComponent, Ozone } from './core/registry.ts';

import { OzButton, OzCard, OzBadge, OzInput, OzSwitch, OzTabs, OzDialog, OzAvatar } from './components/core.ts';
import { OzIcon } from './components/icon.ts';
import { OzStat, OzChart, OzTable, OzSmartView } from './components/admin.ts';
import { OzHero, OzBento, OzPricing, OzMarquee } from './components/landing.ts';
import { OzProductCard, OzRating, OzPost, OzComposer } from './components/commerce-social.ts';
import { OzRenderer } from './ai/renderer.ts';
import { OzCommand, OzInspector } from './components/os.ts';
import { OzHeader, OzFooter, OzBreadcrumbs, OzAlert, OzProgress, OzAccordion, OzTimeline } from './components/layout.ts';

export function defineAllOzoneComponents() {
  registerComponent('oz-icon', OzIcon);
  registerComponent('oz-button', OzButton);
  registerComponent('oz-card', OzCard);
  registerComponent('oz-badge', OzBadge);
  registerComponent('oz-input', OzInput);
  registerComponent('oz-switch', OzSwitch);
  registerComponent('oz-tabs', OzTabs);
  registerComponent('oz-dialog', OzDialog);
  registerComponent('oz-avatar', OzAvatar);

  registerComponent('oz-stat', OzStat);
  registerComponent('oz-chart', OzChart);
  registerComponent('oz-table', OzTable);
  registerComponent('oz-smart-view', OzSmartView);

  registerComponent('oz-hero', OzHero);
  registerComponent('oz-bento', OzBento);
  registerComponent('oz-pricing', OzPricing);
  registerComponent('oz-marquee', OzMarquee);

  registerComponent('oz-product-card', OzProductCard);
  registerComponent('oz-rating', OzRating);
  registerComponent('oz-post', OzPost);
  registerComponent('oz-composer', OzComposer);

  registerComponent('oz-renderer', OzRenderer);
  registerComponent('oz-command', OzCommand);
  registerComponent('oz-inspector', OzInspector);

  registerComponent('oz-header', OzHeader);
  registerComponent('oz-footer', OzFooter);
  registerComponent('oz-breadcrumbs', OzBreadcrumbs);
  registerComponent('oz-alert', OzAlert);
  registerComponent('oz-progress', OzProgress);
  registerComponent('oz-accordion', OzAccordion);
  registerComponent('oz-timeline', OzTimeline);
}

export function bootOzoneUI() {
  if (typeof document === 'undefined') return;
  if (!document.documentElement.dataset.ozMode) {
    document.documentElement.dataset.ozMode = 'atmospheric';
  }
  if (!document.documentElement.dataset.ozTheme) {
    document.documentElement.dataset.ozTheme = 'dark';
  }
  dna.initBranding();
  initAtmosphere();
  defineAllOzoneComponents();
  (window as unknown as { Ozone: typeof Ozone }).Ozone = Ozone;
}

bootOzoneUI();

export { Ozone };
export default Ozone;
