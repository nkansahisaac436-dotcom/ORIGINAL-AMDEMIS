'use client';

import * as React from 'react';

/**
 * Hook to track the mobile visual viewport (virtual keyboard height & visibility).
 * Sets the `--kb` CSS custom property on `document.documentElement`.
 */
export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialHeight = window.innerHeight;

    const update = () => {
      const vv = window.visualViewport;
      let kb = 0;
      let open = false;

      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT');

      if (vv) {
        // Layout viewport vs visual viewport difference (standard iOS Safari)
        const diff = window.innerHeight - vv.height;
        if (diff > 80) {
          kb = Math.round(diff);
          open = true;
        } else if (isInput && window.innerHeight < initialHeight - 100) {
          // Android Chrome / interactive-widget=resizes-content
          kb = Math.round(initialHeight - window.innerHeight);
          open = true;
        } else if (isInput && vv.height < initialHeight - 100) {
          kb = Math.round(initialHeight - vv.height);
          open = true;
        }
      } else if (isInput && window.innerHeight < initialHeight - 100) {
        kb = Math.round(initialHeight - window.innerHeight);
        open = true;
      }

      setKeyboardHeight(kb);
      setIsKeyboardOpen(open);
      document.documentElement.style.setProperty('--kb', `${kb}px`);
    };

    update();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('focusin', update);
    const handleFocusOut = () => {
      setTimeout(update, 120);
    };
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
      window.removeEventListener('focusin', update);
      window.removeEventListener('focusout', handleFocusOut);
      document.documentElement.style.setProperty('--kb', '0px');
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
}

/**
 * Automatically scrolls any focused input / select / textarea to the middle of the visible area
 * after a brief delay (300ms) to allow the virtual keyboard to finish animating open.
 */
export function handleFieldFocus(e: React.FocusEvent<HTMLElement>) {
  const target = e.target;
  if (
    target &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement)
  ) {
    setTimeout(() => {
      try {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        // fallback if smooth scroll not supported
        target.scrollIntoView();
      }
    }, 300);
  }
}
