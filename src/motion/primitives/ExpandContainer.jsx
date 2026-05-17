import { useMotion } from '../hooks/useMotion.js';

/**
 * ExpandContainer
 *
 * Animates height expand/collapse using grid-template-rows (0fr ↔ 1fr).
 * This is the canonical accordion primitive for the entire Dupla UI.
 *
 * WHY grid-template-rows and not height/max-height:
 *   - `height: auto` cannot be animated with CSS transitions.
 *   - `max-height` workaround has incorrect easing: the visible animation
 *     duration depends on content height relative to max-height, making
 *     the timing unreliable.
 *   - `grid-template-rows: 0fr → 1fr` is the modern CSS solution.
 *     It does cause layout recalculation (not compositor-only), but
 *     browsers batch grid layout efficiently and it avoids JS measurement.
 *
 * PERFORMANCE NOTE:
 *   This primitive does NOT use GPU compositing for the height animation.
 *   The tradeoff is accepted because:
 *     a) Height animations cannot be done on the compositor layer in CSS.
 *     b) The alternative (JS height measurement + transform) adds complexity.
 *     c) Modern mobile browsers handle grid recalculation well at 60fps.
 *   If jank is detected in profiling, migrate to clip-path or JS-driven approach.
 *
 * Usage:
 *   <ExpandContainer expanded={isOpen}>
 *     <YourContent />
 *   </ExpandContainer>
 *
 * The outer div handles the height animation.
 * The inner div (overflow: hidden) clips content during collapse.
 * Children render regardless of expanded state — do NOT conditionally render
 * children or the animation has nothing to collapse into.
 */
export function ExpandContainer({
  expanded,
  children,
  duration = 'standard',
  style,
  innerStyle,
  ...props
}) {
  const { dur, ease } = useMotion();

  const ms = dur(duration);
  const ez = expanded ? ease('entrance') : ease('exit');

  return (
    <div
      data-motion="accordion"
      data-state={expanded ? 'expanded' : 'collapsed'}
      style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: `grid-template-rows ${ms}ms ${ez}`,
        ...style,
      }}
      {...props}
    >
      {/* overflow:hidden clips content. min-height:0 allows the inner div to shrink below its natural height. */}
      <div style={{ overflow: 'hidden', minHeight: 0, ...innerStyle }}>
        {children}
      </div>
    </div>
  );
}
