import { useMotion } from '../hooks/useMotion.js';
import { DISTANCES } from '../tokens.js';

/**
 * SlideLayer
 *
 * Combines opacity + translateY/X to create directional presence animations.
 * Used for content that enters from a spatial direction (tab content, month change).
 *
 * Directions:
 *   'up'    → enters from below   (translateY positive → 0)
 *   'down'  → enters from above   (translateY negative → 0)
 *   'left'  → enters from right   (translateX positive → 0)
 *   'right' → enters from left    (translateX negative → 0)
 *
 * IMPORTANT: when reduced motion is active, translate is suppressed entirely.
 * Only the opacity transition survives. This preserves the state-change signal
 * without vestibular-triggering spatial movement.
 *
 * This primitive does NOT manage mount/unmount.
 * It only controls the visual state of already-mounted children.
 *
 * GPU safety:
 *   transform + opacity are compositor-only properties — safe for 60fps on mobile.
 *
 * Usage:
 *   <SlideLayer visible={tab === 'home'} direction="up">
 *     <HomeContent />
 *   </SlideLayer>
 */
export function SlideLayer({
  visible = true,
  direction = 'up',
  distance = 'small',
  duration = 'standard',
  style,
  children,
  ...props
}) {
  const { reduced, transitions, ease } = useMotion();

  const dist = DISTANCES[distance] ?? DISTANCES.small;
  const easeKey = visible ? 'entrance' : 'exit';
  const ez = ease(easeKey);

  // When reduced: translate is always 0 — no spatial movement, only opacity
  const translateMap = {
    up:    `translateY(${dist})`,
    down:  `translateY(-${dist})`,
    left:  `translateX(${dist})`,
    right: `translateX(-${dist})`,
  };

  const hiddenTransform = reduced ? 'translateY(0)' : (translateMap[direction] ?? 'translateY(0)');

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0, 0)' : hiddenTransform,
        transition: transitions([
          ['opacity', duration, easeKey],
          ['transform', duration, easeKey],
        ]),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
