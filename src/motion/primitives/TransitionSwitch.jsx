import { useRef, useLayoutEffect } from 'react';
import { useMotion } from '../hooks/useMotion.js';
import { KEYFRAMES } from '../tokens.js';

/**
 * TransitionSwitch
 *
 * Replays an entry CSS animation every time `watchKey` changes.
 * Used to animate tab content switches without mounting/unmounting content.
 *
 * WHY useLayoutEffect + animation restart:
 *   React renders tab content by conditional rendering (not keeping both mounted).
 *   When a new tab mounts, CSS animations run once automatically.
 *   However, if we want CONSISTENT animation behavior regardless of whether
 *   the tab was previously mounted, we need to force the animation to restart.
 *   This is achieved by clearing the animation, forcing a reflow, then reapplying.
 *
 * WHY NOT CSS :is([data-tab-active]) transitions:
 *   The tab content is conditionally rendered (not always in DOM), so CSS
 *   selectors can't target the outgoing state. TransitionSwitch is the minimal
 *   JS solution for this constraint.
 *
 * Performance:
 *   The animation uses translateY + opacity — both compositor-only properties.
 *   The forced reflow (offsetHeight read) is a single synchronous layout read,
 *   which is acceptable since it only happens on user-initiated tab changes,
 *   not on every render.
 *
 * When reduced motion is active:
 *   animation() returns 'none' — no keyframe fires.
 *   Content appears instantly (normal React mount behavior).
 *
 * Usage:
 *   <TransitionSwitch watchKey={tab}>
 *     {tab === 'home' && <HomeTab />}
 *     {tab === 'movements' && <MovimientosTab />}
 *   </TransitionSwitch>
 */
export function TransitionSwitch({
  watchKey,
  direction = 'neutral', // 'left' | 'right' | 'neutral'
  duration = 'slow',
  style,
  children,
  ...props
}) {
  const ref = useRef(null);
  const { animation } = useMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Select keyframe based on navigation direction
    const keyframe =
      direction === 'left'  ? KEYFRAMES.tabFromRight :
      direction === 'right' ? KEYFRAMES.tabFromLeft  :
      KEYFRAMES.tabEnter;

    // 1. Clear any running animation
    el.style.animation = 'none';

    // 2. Force synchronous layout — triggers browser to acknowledge the reset
    //    This is the standard technique for CSS animation restart.
    //    One layout read per tab switch is acceptable.
    // eslint-disable-next-line no-unused-expressions
    el.offsetHeight;

    // 3. Re-apply the animation
    el.style.animation = animation(keyframe, duration, 'inOut');
  // watchKey and direction are the only dependencies — animation() is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchKey, direction]);

  return (
    <div
      ref={ref}
      data-motion="tab-enter"
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
