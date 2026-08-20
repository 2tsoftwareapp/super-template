"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Manages mount/unmount animation states for slide-over panels, drawers,
 * and other components that need entrance/exit transitions.
 *
 * Returns `visible` (should the DOM element exist?) and `animate` (should
 * the element be in its "open" visual state?). Consumers gate rendering on
 * `visible` and apply CSS transition classes based on `animate`.
 *
 * @example
 * const { visible, animate } = useAnimatePresence(open);
 * if (!visible) return null;
 * return <div className={cn("transition-all", animate ? "translate-x-0" : "translate-x-full")}>...</div>;
 */
export function useAnimatePresence(
  isOpen: boolean,
  durationMs: number = 200,
): { visible: boolean; animate: boolean } {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Double-rAF ensures the browser has painted the "hidden" state
      // before we trigger the transition to the "visible" state.
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setVisible(false);
      }, durationMs);
      return () => clearTimeout(timer);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, durationMs]);

  return { visible, animate };
}
