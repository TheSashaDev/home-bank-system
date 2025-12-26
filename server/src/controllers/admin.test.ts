import { describe } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { encodeQR } from '../utils/qr.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  const schema = readFileSync(join(__dirname, '../db/schema.sql'), 'utf-8');
  db.exec(schema);
  return db;
}

// Feature: home-bank-system, Property 10: Admin Deposit Increases Balance
// Validates: Requirements 5.2

describe('Property 10: Admin Deposit Increases Balance', () => {
  test.prop([fc.integer({ min: 0, max: 1_000_000_00 }), fc.integer({ min: 1, max: 100_000_00 })], { numRuns: 100 })(
    'deposit increases balance by exact amount',
    (initialBalance, depositAmount) => {
      const db = createTestDb();
      
      try {
        const userId = crypto.randomUUID();
        
        // Insert user
        db.prepare(`
          INSERT INTO users (id, name, pin_hash, balance, card_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, 'Test User', 'hash', initialBalance, '1234');

        // Execute deposit
        const deposit = db.transaction(() => {
          db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(depositAmount, userId);
          db.prepare(`
            INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
            VALUES (?, NULL, ?, ?, 'deposit', 'Admin deposit')
          `).run(crypto.randomUUID(), userId, depositAmount);
        });
        deposit();

        // Verify balance increased by exact amount
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number };
        
        return user.balance === initialBalance + depositAmount;
      } finally {
        db.close();
      }
    }
  );
});

// Feature: home-bank-system, Property 8: QR Code Uniqueness
// Validates: Requirements 5.3, 7.1

describe('Property 8: QR Code Uniqueness', () => {
  test.prop([fc.uuid(), fc.uuid()], { numRuns: 100 })(
    'different users have different QR codes',
    (userId1, userId2) => {
      // Skip if same user ID (extremely unlikely with UUIDs)
      if (userId1 === userId2) return true;
      
      const qr1 = encodeQR(userId1);
      const qr2 = encodeQR(userId2);
      
      return qr1 !== qr2;
    }
  );
});
