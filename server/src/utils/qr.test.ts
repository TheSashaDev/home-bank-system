import { describe } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { encodeQR, decodeQR } from './qr.js';

// Feature: home-bank-system, Property 1: QR Code Round-Trip
// Validates: Requirements 1.1, 7.4

describe('Property 1: QR Code Round-Trip', () => {
  test.prop([fc.uuid()], { numRuns: 100 })(
    'encoding then decoding returns the same user ID',
    (userId) => {
      const encoded = encodeQR(userId);
      const decoded = decodeQR(encoded);
      return decoded === userId;
    }
  );

  test.prop([fc.string({ minLength: 1, maxLength: 100 })], { numRuns: 100 })(
    'encoding then decoding works for any non-empty string ID',
    (userId) => {
      const encoded = encodeQR(userId);
      const decoded = decodeQR(encoded);
      return decoded === userId;
    }
  );

  test.prop([fc.uuid(), fc.uuid()], { numRuns: 100 })(
    'different user IDs produce different QR codes',
    (userId1, userId2) => {
      if (userId1 === userId2) return true;
      const qr1 = encodeQR(userId1);
      const qr2 = encodeQR(userId2);
      return qr1 !== qr2;
    }
  );

  test.prop([fc.string()], { numRuns: 100 })(
    'invalid QR data returns null',
    (invalidData) => {
      // Skip if it happens to be valid JSON with correct structure
      try {
        const parsed = JSON.parse(invalidData);
        if (parsed.v === 1 && parsed.id && parsed.sig) return true;
      } catch {}
      return decodeQR(invalidData) === null;
    }
  );
});
