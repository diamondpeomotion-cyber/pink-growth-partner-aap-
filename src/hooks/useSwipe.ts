import { useState, useEffect, RefObject } from 'react';

interface SwipeInput {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
  threshold?: number;
}

export function useSwipe(ref: RefObject<HTMLElement | null>, input: SwipeInput) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = input.threshold || 50;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      setTouchEnd(null); // Reset touch end to prevent previous swipes from firing
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;
      const isUpSwipe = distanceY > minSwipeDistance;
      const isDownSwipe = distanceY < -minSwipeDistance;

      // Ensure that we only trigger swipe if the swipe direction is dominant
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (isLeftSwipe && input.onSwipedLeft) {
          input.onSwipedLeft();
        }
        if (isRightSwipe && input.onSwipedRight) {
          input.onSwipedRight();
        }
      } else {
        if (isUpSwipe && input.onSwipedUp) {
          input.onSwipedUp();
        }
        if (isDownSwipe && input.onSwipedDown) {
          input.onSwipedDown();
        }
      }
      
      // Reset after swipe calculation
      setTouchStart(null);
      setTouchEnd(null);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStart, touchEnd, input, minSwipeDistance, ref]);
}
