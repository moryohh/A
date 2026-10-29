import { useEffect } from 'react';

const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"]';
const REVEAL_SELECTOR = [
  'main button',
  'main a[href]',
  'main [role="button"]',
  'main article',
  'main [data-motion-reveal]',
].join(',');

/**
 * Adds one shared, lightweight motion language to the app without changing any
 * navigation or game logic: reveal-on-scroll, tactile taps and a pointer ripple.
 */
export function useInterfaceMotion() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observed = new WeakSet<Element>();
    let revealIndex = 0;
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('ui-motion-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -3% 0px' });

    const register = (root: ParentNode) => {
      const candidates = root instanceof Element && root.matches(REVEAL_SELECTOR)
        ? [root, ...root.querySelectorAll(REVEAL_SELECTOR)]
        : [...root.querySelectorAll(REVEAL_SELECTOR)];

      candidates.forEach((element) => {
        if (observed.has(element) || element.closest('[data-motion="off"]')) return;
        observed.add(element);
        element.classList.add('ui-motion-reveal');
        (element as HTMLElement).style.setProperty('--ui-motion-delay', `${(revealIndex++ % 6) * 34}ms`);
        revealObserver.observe(element);
      });
    };

    register(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) register(node);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!target || target.matches(':disabled') || target.closest('[data-motion="off"]')) return;

      const rect = target.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height) * 1.7;
      const ripple = document.createElement('span');
      ripple.className = 'ui-motion-ripple';
      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;
      target.classList.add('ui-motion-pressable');
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!target || target.matches(':disabled') || target.closest('[data-motion="off"]')) return;
      target.classList.remove('ui-motion-confirm');
      void target.offsetWidth;
      target.classList.add('ui-motion-confirm');
      window.setTimeout(() => target.classList.remove('ui-motion-confirm'), 430);
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('click', onClick, { passive: true });
    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('click', onClick);
    };
  }, []);
}
