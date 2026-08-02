import { useEffect, useRef, RefObject } from 'react';

interface SwipeInput {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
  threshold?: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Detects directional swipes on the element held by `ref`.
 *
 * Touch coordinates are kept in refs rather than state: the previous version
 * stored them with `useState`, which meant every `touchmove` triggered a
 * re-render of the whole app *and* re-ran the effect, detaching and
 * re-attaching the listeners mid-gesture. The `touchend` handler then read the
 * stale coordinates captured by its closure, so swipes were frequently missed.
 *
 * The callbacks are also kept in a ref so that passing a new inline `input`
 * object on every render (the normal usage) no longer re-subscribes.
 */
export function useSwipe(ref: RefObject<HTMLElement | null>, input: SwipeInput) {
  const touchStart = useRef<Point | null>(null);
  const touchEnd = useRef<Point | null>(null);

  // Latest callbacks, synced after each commit so the listeners below always
  // invoke the current handlers without needing to re-subscribe.
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.targetTouches[0];
      if (!touch) return;
      touchEnd.current = null; // reset so a stale end point can't fire
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.targetTouches[0];
      if (!touch) return;
      touchEnd.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = () => {
      const start = touchStart.current;
      const end = touchEnd.current;
      touchStart.current = null;
      touchEnd.current = null;
      if (!start || !end) return;

      const handlers = inputRef.current;
      const minSwipeDistance = handlers.threshold ?? 50;

      const distanceX = start.x - end.x;
      const distanceY = start.y - end.y;

      // Only fire along the dominant axis so a mostly-vertical scroll doesn't
      // register as a horizontal navigation swipe.
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (distanceX > minSwipeDistance) handlers.onSwipedLeft?.();
        else if (distanceX < -minSwipeDistance) handlers.onSwipedRight?.();
      } else {
        if (distanceY > minSwipeDistance) handlers.onSwipedUp?.();
        else if (distanceY < -minSwipeDistance) handlers.onSwipedDown?.();
      }
    };

    const onTouchCancel = () => {
      touchStart.current = null;
      touchEnd.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [ref]);
}
