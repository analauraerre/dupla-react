/**
 * DUPLA MOTION SYSTEM — Public API
 *
 * Everything motion-related is imported from here.
 * Never import directly from sub-modules in application code.
 *
 * Usage:
 *   import { useMotion, ExpandContainer, DURATIONS } from '../motion/index.js';
 *
 * What's exported:
 *   Tokens      → DURATIONS, EASINGS, SCALES, DISTANCES, OPACITIES, KEYFRAMES
 *   Hook        → useMotion()
 *   Primitives  → ExpandContainer, FadeLayer, SlideLayer, FloatingLayer,
 *                 MotionPressable, TransitionSwitch
 *   Utils       → motionTransition, motionTransitions, motionAnimation, motionPressTransform
 */

// Tokens
export {
  DURATIONS,
  EASINGS,
  SCALES,
  DISTANCES,
  OPACITIES,
  KEYFRAMES,
  REDUCED_MAX_DURATION,
} from './tokens.js';

// Hook
export { useMotion } from './hooks/useMotion.js';

// Primitives
export {
  ExpandContainer,
  FadeLayer,
  SlideLayer,
  FloatingLayer,
  MotionPressable,
  TransitionSwitch,
  HorizontalPager,
} from './primitives/index.js';

// Utils
export {
  motionTransition,
  motionTransitions,
  motionAnimation,
  motionPressTransform,
} from './utils/motionProps.js';

// Policy
export {
  ZONE_ASSIGNMENTS,
  MAX_CONCURRENT,
  ACCORDION_CLEAR_DELAY,
} from './motionPolicy.js';
