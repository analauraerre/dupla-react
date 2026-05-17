import { DURATIONS, EASINGS, REDUCED_MAX_DURATION } from '../tokens.js';

/**
 * motionProps — Pure CSS string generation utilities
 *
 * These are PURE functions (no hooks, no React) for generating motion-related
 * CSS property values from tokens. Use them when:
 *
 *   a) You need a motion value outside a React component (e.g., in a callback,
 *      a style helper, or themeStyles.js).
 *   b) You want to avoid re-rendering a component just to get a motion string.
 *   c) You need to generate transition strings imperatively (e.g., for JS-driven animations).
 *
 * For React components, prefer the useMotion() hook — it handles reduced motion
 * reactively and provides a more ergonomic API.
 *
 * These utilities do NOT handle reduced motion automatically.
 * Pass `reduced = true` explicitly when calling from a context where you know
 * the user's preference.
 */

/**
 * Generate a single CSS transition string.
 *
 * @param {string}  property    - CSS property name (e.g., 'opacity', 'transform')
 * @param {string}  durationKey - Key from DURATIONS (e.g., 'standard', 'fast')
 * @param {string}  easingKey   - Key from EASINGS (e.g., 'entrance', 'exit')
 * @param {boolean} reduced     - Apply reduced-motion compression
 * @returns {string} CSS transition value
 *
 * Example:
 *   motionTransition('opacity', 'standard', 'entrance')
 *   → 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)'
 */
export function motionTransition(
  property,
  durationKey = 'standard',
  easingKey = 'standard',
  reduced = false,
) {
  const rawMs = DURATIONS[durationKey] ?? DURATIONS.standard;
  const ms = reduced ? Math.min(rawMs, REDUCED_MAX_DURATION) : rawMs;
  const ez = EASINGS[easingKey] ?? EASINGS.standard;
  return `${property} ${ms}ms ${ez}`;
}

/**
 * Generate multiple CSS transition strings joined by comma.
 *
 * @param {Array<[string, string?, string?]>} pairs - [property, durationKey?, easingKey?]
 * @param {boolean} reduced - Apply reduced-motion compression
 * @returns {string} CSS transition value for multiple properties
 *
 * Example:
 *   motionTransitions([['opacity'], ['transform', 'standard', 'entrance']])
 *   → 'opacity 200ms ..., transform 200ms ...'
 */
export function motionTransitions(pairs, reduced = false) {
  return pairs
    .map(([prop, dk = 'standard', ek = 'standard']) =>
      motionTransition(prop, dk, ek, reduced)
    )
    .join(', ');
}

/**
 * Generate a CSS animation string from a keyframe name.
 * Returns 'none' when reduced = true (keyframe animations are always disabled).
 *
 * @param {string}  keyframeName - CSS @keyframes name (use KEYFRAMES constants)
 * @param {string}  durationKey  - Key from DURATIONS
 * @param {string}  easingKey    - Key from EASINGS
 * @param {boolean} reduced      - Returns 'none' if true
 * @param {string}  extra        - Additional animation shorthand tokens (e.g., 'infinite')
 * @returns {string} CSS animation shorthand value
 *
 * Example:
 *   motionAnimation(KEYFRAMES.tabEnter, 'slow', 'entrance')
 *   → 'dupla-tab-enter 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
 */
export function motionAnimation(
  keyframeName,
  durationKey = 'standard',
  easingKey = 'entrance',
  reduced = false,
  extra = '',
) {
  if (reduced) return 'none';
  const ms = DURATIONS[durationKey] ?? DURATIONS.standard;
  const ez = EASINGS[easingKey] ?? EASINGS.entrance;
  return `${keyframeName} ${ms}ms ${ez} forwards${extra ? ` ${extra}` : ''}`;
}

/**
 * Generate a CSS transform string for press scale.
 * Returns 'scale(1)' when reduced = true.
 *
 * @param {number}  scaleValue - Target scale (e.g., SCALES.press = 0.97)
 * @param {boolean} pressed    - Whether the press state is active
 * @param {boolean} reduced    - Skip scale if true
 * @returns {string} CSS transform value
 */
export function motionPressTransform(scaleValue, pressed, reduced = false) {
  if (!pressed || reduced) return 'scale(1)';
  return `scale(${scaleValue})`;
}
