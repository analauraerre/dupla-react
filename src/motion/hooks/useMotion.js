import { useState, useEffect, useMemo } from 'react';
import {
  DURATIONS,
  EASINGS,
  SCALES,
  DISTANCES,
  KEYFRAMES,
  REDUCED_MAX_DURATION,
} from '../tokens.js';

// ── Snapshot helper (safe for SSR / no-window environments) ──────────────────
function readPrefersReduced() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── useMotion ─────────────────────────────────────────────────────────────────
//
// The single hook that all motion-aware components use.
//
// Returns a stable API object containing:
//   reduced    — boolean: is reduced motion requested by the OS?
//   dur(key)   — resolved duration in ms (respects reduced)
//   ease(key)  — easing string from EASINGS
//   transition — generates a CSS transition string
//   transitions — generates multiple CSS transitions joined by comma
//   animation  — generates a CSS animation string (returns 'none' when reduced)
//   scales     — SCALES token object (read-only)
//   distances  — DISTANCES token object (read-only)
//   keyframes  — KEYFRAMES token object (read-only)
//
// IMPORTANT: when reduced === true
//   - transition() still works but with compressed duration (≤80ms)
//   - animation() returns 'none' — keyframe animations are disabled entirely
//   - Scale and translate primitives collapse to near-instant state changes
//   This preserves feedback without spatial movement, per WCAG 2.3.3 (AAA)
//   and best practices for vestibular sensitivity.
//
export function useMotion() {
  const [reduced, setReduced] = useState(readPrefersReduced);

  // Subscribe to OS-level changes (user may toggle accessibility setting at runtime)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return useMemo(() => {
    // Resolved duration: compressed to REDUCED_MAX_DURATION when OS requests it
    const dur = (key) => {
      const raw = DURATIONS[key] ?? DURATIONS.standard;
      return reduced ? Math.min(raw, REDUCED_MAX_DURATION) : raw;
    };

    // Direct easing access
    const ease = (key) => EASINGS[key] ?? EASINGS.standard;

    // Single CSS transition string
    // transition('opacity', 'standard', 'entrance')
    // → 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)'
    const transition = (property, durationKey = 'standard', easingKey = 'standard') =>
      `${property} ${dur(durationKey)}ms ${ease(easingKey)}`;

    // Multiple CSS transitions joined: transitions([['opacity'], ['transform', 'standard', 'entrance']])
    // → 'opacity 200ms ..., transform 200ms ...'
    const transitions = (pairs) =>
      pairs
        .map(([prop, dk = 'standard', ek = 'standard']) => `${prop} ${dur(dk)}ms ${ease(ek)}`)
        .join(', ');

    // CSS animation string for keyframe animations
    // animation('dupla-tab-enter', 'slow', 'entrance')
    // → 'dupla-tab-enter 280ms cubic-bezier(0.16,1,0.3,1) forwards'
    // Returns 'none' when reduced — keyframe animations are fully disabled
    const animation = (keyframe, durationKey = 'standard', easingKey = 'entrance', extra = '') => {
      if (reduced) return 'none';
      const ms = dur(durationKey);
      const ez = ease(easingKey);
      return `${keyframe} ${ms}ms ${ez} forwards${extra ? ` ${extra}` : ''}`;
    };

    return {
      reduced,
      dur,
      ease,
      transition,
      transitions,
      animation,
      scales: SCALES,
      distances: DISTANCES,
      keyframes: KEYFRAMES,
    };
  }, [reduced]);
}
