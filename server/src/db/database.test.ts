import { describe, beforeEach, afterEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Feature: home-bank-system, Property 9: Data Persistence
// Validates: Requirements 5.5

describe('Property 9: Data Persistence', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
  });

  afterEach(() => {
    db.close();
  });

  // Arbitrary for transaction type
  const transactionTypeArb = fc.constantFrom('transfer', 'deposit', 'withdrawal');

  // Arbitrary for valid user data
  const userArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    pinHash: fc.hexaString({ minLength: 64, maxLength: 64 }),
    balance: fc.integer({ min: 0, max: 1_000_000_00 }),
    cardNumber: fc.stringMatching(/^\d{4}$/),
  });

  // Arbitrary for transaction data
  const transactionArb = fc.record({
    id: fc.uuid(),
    amount: fc.integer({ min: 1, max: 1_000_000_00 }),
    type: transactionTypeArb,
    description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  });

  test.prop([userArb, userArb, transactionArb], { numRuns: 100 })(
    'transaction persists with all fields intact',
    (fromUser, toUser, tx) => {
      // Ensure different users
      if (fromUser.id === toUser.id) return true;

      // Insert users first
      db.prepare(`
        INSERT INTO users (id, name, pin_hash, balance, card_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(fromUser.id, fromUser.name, fromUser.pinHash, fromUser.balance, fromUser.cardNumber);

      db.prepare(`
        INSERT INTO users (id, name, pin_hash, balance, card_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(toUser.id, toUser.name, toUser.pinHash, toUser.balance, toUser.cardNumber);

      // Insert transaction
      const fromUserId = tx.type === 'deposit' ? null : fromUser.id;
      db.prepare(`
        INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tx.id, fromUserId, toUser.id, tx.amount, tx.type, tx.description);

      // Query transaction back
      const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(tx.id) as {
        id: string;
        from_user_id: string | null;
        to_user_id: string;
        amount: number;
        type: string;
        description: string | null;
        created_at: number;
      };

      // Verify all fields
      return (
        row.id === tx.id &&
        row.from_user_id === fromUserId &&
        row.to_user_id === toUser.id &&
        row.amount === tx.amount &&
        row.type === tx.type &&
        row.description === tx.description &&
        typeof row.created_at === 'number'
      );
    }
  );

  test.prop([userArb], { numRuns: 100 })(
    'user persists with all fields intact',
    (user) => {
      // Insert user
      db.prepare(`
        INSERT INTO users (id, name, pin_hash, balance, card_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, user.name, user.pinHash, user.balance, user.cardNumber);

      // Query user back
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as {
        id: string;
        name: string;
        pin_hash: string;
        balance: number;
        card_number: string;
        is_admin: number;
        is_blocked: number;
        failed_attempts: number;
        created_at: number;
      };

      // Verify all fields
      return (
        row.id === user.id &&
        row.name === user.name &&
        row.pin_hash === user.pinHash &&
        row.balance === user.balance &&
        row.card_number === user.cardNumber &&
        row.is_admin === 0 &&
        row.is_blocked === 0 &&
        row.failed_attempts === 0 &&
        typeof row.created_at === 'number'
      );
    }
  );
});
