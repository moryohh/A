import { useEffect } from 'react';
import { appSfx } from './appSfx';

const MIN_VERTICAL_SWIPE_PX = 64;
const MAX_HORIZONTAL_RATIO = 0.85;

export function useSwipeSfx() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, canvas, [data-no-swipe-sfx]')) {
        tracking = false;
        return;
      }
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking || event.changedTouches.length !== 1) return;
      tracking = false;
      const deltaX = event.changedTouches[0].clientX - startX;
      const deltaY = event.changedTouches[0].clientY - startY;
      if (Math.abs(deltaY) < MIN_VERTICAL_SWIPE_PX) return;
      if (Math.abs(deltaX) > Math.abs(deltaY) * MAX_HORIZONTAL_RATIO) return;

      // Finger moving upward reveals content below; finger moving downward
      // returns toward content above. Each direction has its own short cue.
      if (deltaY < 0) appSfx.swipeUp();
      else appSfx.swipeDown();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchend', onTouchEnd, true);
    };
  }, []);
}
