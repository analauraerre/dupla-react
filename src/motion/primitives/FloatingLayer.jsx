import { useMotion } from '../hooks/useMotion.js';
import { KEYFRAMES } from '../tokens.js';

/**
 * FloatingLayer
 *
 * Entry animation wrapper for elements in the floating surface plane:
 * dropdowns, user menus, contextual panels.
 *
 * Uses the 'dupla-float-in' keyframe: opacity 0→1 + scale 0.97→1 + translateY 6px→0.
 * This creates the perception that the panel "rises from" its trigger point.
 *
 * OWNERSHIP: FloatingLayer is ONLY for positioned elements (absolute/fixed).
 * Do not use for inline content — use FadeLayer or SlideLayer instead.
 *
 * The entry animation plays ONCE on mount via the keyframe.
 * There is NO exit animation — the parent manages unmounting.
 * If an exit animation is needed, the parent should delay unmounting
 * and apply the 'dupla-collapse-out' keyframe manually before removing.
 *
 * When reduced motion is active: animation() returns 'none'.
 * The element still appears — it just appears without the keyframe animation.
 * The parent's border/shadow already makes it visible.
 *
 * Usage:
 *   {showDropdown && (
 *     <FloatingLayer style={{ position: 'absolute', top: '100%', right: 0 }}>
 *       <DropdownContent />
 *     </FloatingLayer>
 *   )}
 */
export function FloatingLayer({
  duration = 'moderate',
  style,
  children,
  ...props
}) {
  const { animation } = useMotion();

  return (
    <div
      data-motion="float-in"
      data-surface="floating"
      style={{
        animation: animation(KEYFRAMES.floatIn, duration, 'inOut'),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
