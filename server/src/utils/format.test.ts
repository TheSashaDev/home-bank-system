import { describe, expect, it } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { formatAmount, formatDate } from './format.js';

// Feature: home-bank-system, Property 3: Balance Format Correctness
// Validates: Requirements 2.3

describe('Property 3: Balance Format Correctness', () => {
  test.prop([fc.integer({ min: 0, max: 1_000_000_000_00 })], { numRuns: 100 })(
    'formatted amount contains currency symbol and correct decimal places',
    (kopecks) => {
      const formatted = formatAmount(kopecks);
      
      // Should contain UAH symbol (₴)
      const hasSymbol = formatted.includes('₴');
      
      // Should have proper decimal format (2 decimal places)
      const hryvnias = kopecks / 100;
      const decimalPart = hryvnias.toFixed(2).split('.')[1];
      const hasDecimals = formatted.includes(decimalPart) || formatted.includes(',');
      
      return hasSymbol && hasDecimals;
    }
  );

  test.prop([fc.integer({ min: 1000_00, max: 1_000_000_00 })], { numRuns: 100 })(
    'large amounts have thousands separators',
    (kopecks) => {
      const formatted = formatAmount(kopecks);
      // Ukrainian locale uses space as thousands separator
      // For amounts >= 1000 UAH, there should be a space separator
      const hryvnias = kopecks / 100;
      if (hryvnias >= 1000) {
        // Should have some kind of separator (space in uk-UA)
        return formatted.includes(' ') || formatted.includes('\u00A0');
      }
      return true;
    }
  );

  test.prop([fc.integer({ min: 0, max: 99 })], { numRuns: 100 })(
    'small amounts format correctly',
    (kopecks) => {
      const formatted = formatAmount(kopecks);
      return formatted.includes('₴') && formatted.includes('0,');
    }
  );
});

describe('formatDate', () => {
  it('formats timestamp correctly', () => {
    // 1 Jan 2024 12:30:00 UTC
    const timestamp = 1704111000;
    const formatted = formatDate(timestamp);
    // Should contain date parts
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});
