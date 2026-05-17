import { useState } from 'react';
import { useMotion } from '../hooks/useMotion.js';
import { DURATIONS, EASINGS } from '../tokens.js';

/**
 * MotionPressable
 *
 * Wraps any interactive element and adds physical press feedback via scale.
 * This is the canonical press-state primitive for the entire Dupla UI.
 *
 * Behavior:
 *   onPointerDown  → transform: scale(scaleValue)  [DURATIONS.micro ms]
 *   onPointerUp    → transform: scale(1)            [DURATIONS.micro ms]
 *   onPointerLeave → transform: scale(1)            [DURATIONS.micro ms]
 *
 * The scale transition uses DURATIONS.micro directly (not via useMotion)
 * because press feedback MUST be instantaneous regardless of reduced motion.
 * The difference between 80ms and "none" is imperceptible for scale(0.97).
 *
 * When reduced motion is active:
 *   scale is set to 1 (no transform), but the transition still applies.
 *   The element still responds to press events — just without visual scale.
 *
 * IMPORTANT:
 *   - Use `as="button"` when wrapping a CTA to preserve native button semantics.
 *   - Do NOT nest interactive elements inside MotionPressable.
 *   - Do NOT use for inline text — only for block/flex interactive elements.
 *
 * scaleVariant:
 *   'press'      → 0.97  (primary CTAs, submit buttons)
 *   'pressLight' → 0.98  (secondary buttons, list items)
 *
 * Usage:
 *   <MotionPressable as="button" scaleVariant="press" onClick={handleSubmit} style={Sx.btn}>
 *     Guardar gasto
 *   </MotionPressable>
 */
export function MotionPressable({
  as: Tag = 'div',
  scaleVariant = 'press',
  style,
  children,
  ...props
}) {
  const [pressed, setPressed] = useState(false);
  const { reduced, scales } = useMotion();

  const targetScale = reduced ? 1 : (scales[scaleVariant] ?? scales.press);

  // Press feedback uses micro duration directly — must feel instantaneous
  const pressTransition = `transform ${DURATIONS.micro}ms ${EASINGS.standard}`;

  return (
    <Tag
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        transform: pressed ? `scale(${targetScale})` : 'scale(1)',
        transition: pressTransition,
        // Prevent content selection during press
        userSelect: 'none',
        WebkitUserSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
