import { Children } from 'react';
import { DURATIONS, EASINGS } from '../tokens.js';

/**
 * HorizontalPager
 *
 * Lays out N panels side-by-side in a flex track and slides between them
 * by translating the track on activeIndex change.
 *
 * Both panels are always in the DOM — no mount/unmount on tab switch.
 * This preserves scroll position and form state across switches.
 *
 * Layout math (2 panels):
 *   track width  = 200%  (relative to the viewport wrapper)
 *   each panel   = 50%   (of track = 100% of wrapper)
 *   translateX   = -activeIndex * (100 / count)%
 *
 * overflow:hidden on the wrapper clips the off-screen panel.
 * willChange:transform promotes the track to its own compositor layer.
 *
 * Usage:
 *   <HorizontalPager activeIndex={tab === 'a' ? 0 : 1}>
 *     <EgresosPanel />
 *     <IngresosPanel />
 *   </HorizontalPager>
 */
export function HorizontalPager({
  activeIndex,
  duration = DURATIONS.slow,
  easing   = EASINGS.inOut,
  style,
  children,
}) {
  const count = Children.count(children);
  const offset = count > 0 ? -activeIndex * (100 / count) : 0;

  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div
        data-motion="h-pager-track"
        style={{
          display:    'flex',
          width:      `${count * 100}%`,
          transform:  `translateX(${offset}%)`,
          transition: `transform ${duration}ms ${easing}`,
          willChange: 'transform',
          alignItems: 'flex-start',
        }}
      >
        {Children.map(children, child => (
          <div style={{ width: `${100 / count}%`, minWidth: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
