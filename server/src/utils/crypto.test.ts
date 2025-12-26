import { describe } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { hashPin, verifyPin } from './crypto.js';

// Feature: home-bank-system, Property 2: PIN Verification Consistency
// Validates: Requirements 1.3

describe('Property 2: PIN Verification Consistency', () => {
  // 4-digit PIN arbitrary
  const pinArb = fc.stringMatching(/^\d{4}$/);

  test.prop([pinArb], { numRuns: 100 })(
    'correct PIN verifies successfully',
    (pin) => {
      const hash = hashPin(pin);
      return verifyPin(pin, hash) === true;
    }
  );

  test.prop([pinArb, pinArb], { numRuns: 100 })(
    'wrong PIN fails verification',
    (correctPin, wrongPin) => {
      if (correctPin === wrongPin) return true;
      const hash = hashPin(correctPin);
      return verifyPin(wrongPin, hash) === false;
    }
  );

  test.prop([pinArb], { numRuns: 100 })(
    'same PIN produces different hashes (due to random salt)',
    (pin) => {
      const hash1 = hashPin(pin);
      const hash2 = hashPin(pin);
      // Hashes should be different due to random salt
      return hash1 !== hash2;
    }
  );

  test.prop([pinArb], { numRuns: 100 })(
    'hash format is salt:hash',
    (pin) => {
      const hash = hashPin(pin);
      const parts = hash.split(':');
      return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
    }
  );
});
