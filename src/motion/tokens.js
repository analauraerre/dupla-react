/**
 * DUPLA MOTION TOKENS
 *
 * Single source of truth for all motion values.
 * No duration, easing, scale, or distance is ever hardcoded in a component.
 *
 * Philosophy: "Settled Warmth" — suave, decisivo, funcional primero.
 * Three speeds. Three easings. Nothing else.
 */

// ── Durations (ms) ────────────────────────────────────────────────────────────
//
// Five tiers. Each tier has a clear semantic meaning.
// Never use a value not in this table.
//
//  micro      → Press feedback, focus rings, hover color shifts.
//               Must feel instantaneous — any longer breaks the illusion of physical response.
//  fast       → Exits. Things leaving should clear the path quickly.
//               Slightly faster than entrances so the user's eye follows the new thing, not the old.
//  standard   → Accordions, dropdowns, toasts, chip selection.
//               The "default" speed of the UI. Calibrated for mobile 60fps without jank.
//  slow       → Tab switches, month navigation content change.
//               Context changes need slightly more time so the user doesn't lose orientation.
//  expressive → Chart build-ins, hero number morph, first-entry delight.
//               Only allowed in contemplative zones (ChartsTab) or milestone moments.
//               Never in the critical capture path.
//
export const DURATIONS = {
  micro:      80,
  fast:      140,
  standard:  200,
  moderate:  300,
  slow:      400,
  expressive: 400,
};

// ── Easings ───────────────────────────────────────────────────────────────────
//
// Three curves. That's the complete system.
//
//  entrance   → Fast start, soft settle. Used for anything APPEARING.
//               Already used in dp-expand-in and dp-toast-in — we standardize here.
//               Feels like something being placed, not thrown.
//
//  exit       → Accelerates into the void. Used for anything DISAPPEARING.
//               Exits are faster than entrances AND they ease in — clears the path quickly.
//
//  standard   → Balanced. Used for state transitions (active ↔ inactive, color, scale).
//               Not dramatic. Just smooth.
//
// INTENTIONALLY OMITTED:
//  - bounce/spring: overshoot contradicts the product's tone
//  - linear: only acceptable for infinite rotations (dupla-spin)
//  - elastic: too playful for a finance tool
//
export const EASINGS = {
  entrance:  'cubic-bezier(0.16, 1, 0.3, 1)',
  exit:      'cubic-bezier(0.4, 0, 1, 1)',
  standard:  'cubic-bezier(0.2, 0, 0, 1)',
  inOut:     'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ── Scales ────────────────────────────────────────────────────────────────────
//
// For press feedback and hover lift.
// Values deliberately close to 1 — subtle physical response, not dramatization.
//
export const SCALES = {
  press:      0.97,  // CTA buttons, primary actions
  pressLight: 0.98,  // Secondary buttons, list item rows
  rise:       1.02,  // Hover lift for cards (desktop only — not implemented on mobile)
};

// ── Distances (translateX/Y) ──────────────────────────────────────────────────
//
// For slide animations. Kept intentionally small — this is not parallax.
// Larger distances would feel theatrical.
//
// Note: these are raw pixel values as strings.
// With fontScale zoom applied to the container, these remain visually consistent.
//
export const DISTANCES = {
  micro:    '4px',
  small:    '8px',
  standard: '12px',
  large:    '20px',
};

// ── Opacities ─────────────────────────────────────────────────────────────────
//
// Named opacity stops. Consistent across the system.
//
export const OPACITIES = {
  hidden:  0,
  ghost:   0.4,
  dim:     0.6,
  muted:   0.85,
  visible: 1,
};

// ── Keyframe names ────────────────────────────────────────────────────────────
//
// CSS @keyframe animation names as constants.
// Never reference keyframe names as raw strings in components.
// If a keyframe is renamed in index.css, update here — one place.
//
export const KEYFRAMES = {
  // Existing (from index.css — do not rename without updating index.css)
  rise:       'dupla-rise',
  pulse:      'dupla-pulse',
  spin:       'dupla-spin',
  expandIn:   'dp-expand-in',
  toastIn:    'dp-toast-in',

  // New (added in this motion system)
  tabEnter:    'dupla-tab-enter',
  tabFromRight:'dupla-tab-from-right',
  tabFromLeft: 'dupla-tab-from-left',
  floatIn:     'dupla-float-in',
  collapseOut: 'dupla-collapse-out',
};

// ── Reduced motion overrides ──────────────────────────────────────────────────
//
// When prefers-reduced-motion is active, durations compress but DON'T zero out.
// The user still needs feedback — just less kinetic.
//
// Rule: max duration under reduced motion is DURATIONS.micro (80ms).
// This provides state-change feedback (color, border) without spatial movement.
//
export const REDUCED_MAX_DURATION = DURATIONS.micro;
