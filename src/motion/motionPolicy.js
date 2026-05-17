/**
 * DUPLA MOTION POLICY
 *
 * Zone assignments and coordination constants.
 * Defines which tabs animate and at what density.
 */

// Motion density per tab — drives decisions about what/how much to animate
export const ZONE_ASSIGNMENTS = {
  HomeTab:        'active',
  MovimientosTab: 'active',
  BudgetTab:      'active',
  SavingsTab:     'active',
  ChartsTab:      'expressive',
  CardsTab:       'quiet',
  MasPanel:       'quiet',
};

// Maximum simultaneous animations per zone
export const MAX_CONCURRENT = {
  quiet:      0,
  active:     1,
  expressive: 2,
};

// Must match DURATIONS.standard (200ms) from tokens.js.
// Used to defer form state clearing so ExpandContainer has content during collapse.
export const ACCORDION_CLEAR_DELAY = 200;
