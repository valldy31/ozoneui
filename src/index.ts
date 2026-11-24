// ============================================================================
// OzoneUI v1.0.0 — Main Entry Point
// Registers all 66 Quad-Domain & AI-Native Web Components + Global Ozone API
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
import { OzSidebar, OzAppShell, OzSelect, OzCheckbox, OzRadioGroup, OzTextarea, OzSlider, OzDatePicker, OzFileUpload, OzCombobox, OzParallax, OzReveal, OzSpotlight, OzDrawer, OzDropdown, OzTooltip, OzStepper, OzKanban, OzCalendar, OzColorPicker, OzNumberInput, OzOtpInput, OzGrid, OzCol, OzBottomNav, OzFab, OzAiChat, OzCodeBlock, OzSplitPane, OzTree, OzHoverCard, OzPagination, OzSkeleton, OzEmptyState, getFormData, fillForm, OzCookieConsent, gdpr } from './components/shell-forms.ts';
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

  registerComponent('oz-sidebar', OzSidebar);
  registerComponent('oz-app-shell', OzAppShell);
  registerComponent('oz-select', OzSelect);
  registerComponent('oz-checkbox', OzCheckbox);
  registerComponent('oz-radio-group', OzRadioGroup);
  registerComponent('oz-textarea', OzTextarea);
  registerComponent('oz-slider', OzSlider);
  registerComponent('oz-date-picker', OzDatePicker);
  registerComponent('oz-file-upload', OzFileUpload);
  registerComponent('oz-combobox', OzCombobox);
  registerComponent('oz-parallax', OzParallax);
  registerComponent('oz-reveal', OzReveal);
  registerComponent('oz-spotlight', OzSpotlight);
  registerComponent('oz-drawer', OzDrawer);
  registerComponent('oz-dropdown', OzDropdown);
  registerComponent('oz-tooltip', OzTooltip);
  registerComponent('oz-stepper', OzStepper);
  registerComponent('oz-kanban', OzKanban);
  registerComponent('oz-calendar', OzCalendar);
  registerComponent('oz-color-picker', OzColorPicker);
  registerComponent('oz-number-input', OzNumberInput);
  registerComponent('oz-otp-input', OzOtpInput);
  registerComponent('oz-grid', OzGrid);
  registerComponent('oz-col', OzCol);
  registerComponent('oz-bottom-nav', OzBottomNav);
  registerComponent('oz-fab', OzFab);
  registerComponent('oz-ai-chat', OzAiChat);
  registerComponent('oz-code-block', OzCodeBlock);
  registerComponent('oz-split-pane', OzSplitPane);
  registerComponent('oz-tree', OzTree);
  registerComponent('oz-hover-card', OzHoverCard);
  registerComponent('oz-pagination', OzPagination);
  registerComponent('oz-skeleton', OzSkeleton);
  registerComponent('oz-empty-state', OzEmptyState);
  registerComponent('oz-cookie-consent', OzCookieConsent);
}

export function bootOzoneUI() {
  if (typeof document === 'undefined') return;
  if (!document.documentElement.dataset.ozMode) {
    document.documentElement.dataset.ozMode = 'atmospheric';
  }
  if (!document.documentElement.dataset.ozTheme) {
    document.documentElement.dataset.ozTheme = 'dark';
  }
  if (gdpr.getConsent()?.strict) {
    document.documentElement.dataset.ozGdpr = 'strict';
  }
  dna.initBranding();
  initAtmosphere();
  defineAllOzoneComponents();
  Object.assign(Ozone, { getFormData, fillForm, gdpr });
  (window as unknown as { Ozone: typeof Ozone }).Ozone = Ozone;
}

bootOzoneUI();

export { Ozone };
export default Ozone;
