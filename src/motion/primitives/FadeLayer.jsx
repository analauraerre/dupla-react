import { useMotion } from '../hooks/useMotion.js';

/**
 * FadeLayer
 *
 * Controls opacity presence of its children.
 * Does NOT mount/unmount — use when the element should remain in the DOM
 * even when invisible (e.g., to preserve form state, avoid reflow).
 *
 * For elements that should be fully removed from DOM when invisible,
 * use conditional rendering + a CSS entry animation instead.
 *
 * When visible=false:
 *   - opacity → 0
 *   - pointerEvents → 'none' (prevents interaction with invisible element)
 *   - The element still occupies layout space
 *
 * When reduced motion is active:
 *   - Transition still occurs but at DURATIONS.micro (80ms)
 *   - No spatial movement — just the opacity change
 *
 * Usage:
 *   <FadeLayer visible={showHint}>
 *     <HelperText>Tocá para escribir el monto</HelperText>
 *   </FadeLayer>
 */
export function FadeLayer({
  visible = true,
  duration = 'standard',
  style,
  children,
  ...props
}) {
  const { transition, ease } = useMotion();

  const easeKey = visible ? 'entrance' : 'exit';

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? undefined : 'none',
        transition: transition('opacity', duration, easeKey),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
