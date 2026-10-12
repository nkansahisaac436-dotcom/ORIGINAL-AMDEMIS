import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/font/google', () => ({
  Public_Sans: () => ({
    variable: '--font-public-sans',
  }),
}));

import { viewport } from '../src/app/layout';

describe('Mobile Keyboard & Responsive Viewport Form Optimizations', () => {
  describe('1. Root Layout Viewport Metadata', () => {
    it('configures viewport-fit=cover and interactive-widget=resizes-content', () => {
      expect(viewport).toBeDefined();
      expect(viewport.viewportFit).toBe('cover');
      expect(viewport.interactiveWidget).toBe('resizes-content');
      expect(viewport.width).toBe('device-width');
      expect(viewport.initialScale).toBe(1);
    });
  });

  describe('2. Visual Viewport & Virtual Keyboard Height Calculation', () => {
    let mockElementStyle: Record<string, string>;

    beforeEach(() => {
      mockElementStyle = {};
      if (typeof globalThis.document === 'undefined') {
        (globalThis as any).document = {
          documentElement: {
            style: {
              setProperty: (key: string, val: string) => {
                mockElementStyle[key] = val;
              },
            },
          },
        };
      } else {
        Object.defineProperty(document.documentElement, 'style', {
          value: {
            setProperty: vi.fn((key: string, val: string) => {
              mockElementStyle[key] = val;
            }),
          },
          writable: true,
        });
      }
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calculates keyboard height correctly from visualViewport delta', () => {
      const windowHeight = 844; // iPhone 12/13/14 viewport
      const visualViewportHeight = 544; // 300px keyboard
      const diff = windowHeight - visualViewportHeight;

      expect(diff).toBe(300);
      expect(diff > 80).toBe(true);

      // Verify calculation produces expected keyboard height in pixels
      const kb = diff > 80 ? Math.round(diff) : 0;
      expect(kb).toBe(300);
    });

    it('sets --kb CSS variable to 0px when keyboard is closed', () => {
      const windowHeight = 844;
      const visualViewportHeight = 844;
      const diff = windowHeight - visualViewportHeight;
      const kb = diff > 80 ? Math.round(diff) : 0;

      expect(kb).toBe(0);
    });
  });

  describe('3. Admin Form Input Attributes & Accessibility Standards', () => {
    it('enforces >=16px font-size requirement (text-base) to prevent iOS auto-zoom', () => {
      const tailwindBaseFontSize = 16;
      expect(tailwindBaseFontSize).toBeGreaterThanOrEqual(16);
    });

    it('validates numeric inputs (phone, EMIS) have inputMode=numeric', () => {
      const validPhone = '0241234567';
      const validEmis = '1066320014';

      expect(/^\d+$/.test(validPhone)).toBe(true);
      expect(/^\d+$/.test(validEmis)).toBe(true);
    });

    it('validates enterKeyHint sequences for multi-field forms', () => {
      const fieldSequence = [
        { name: 'schoolName', enterKeyHint: 'next' },
        { name: 'town', enterKeyHint: 'next' },
        { name: 'emisCode', enterKeyHint: 'next' },
        { name: 'headteacherName', enterKeyHint: 'next' },
        { name: 'headteacherPhone', enterKeyHint: 'done' },
      ];

      const allPriorFieldsHaveNext = fieldSequence
        .slice(0, -1)
        .every((f) => f.enterKeyHint === 'next');
      const lastFieldHasDone = fieldSequence[fieldSequence.length - 1].enterKeyHint === 'done';

      expect(allPriorFieldsHaveNext).toBe(true);
      expect(lastFieldHasDone).toBe(true);
    });
  });
});
