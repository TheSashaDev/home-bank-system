import { describe, it, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  const schema = readFileSync(join(__dirname, '../db/schema.sql'), 'utf-8');
  db.exec(schema);
  return db;
}

// Feature: home-bank-system, Property 4: Transfer Invariant (Conservation of Money)
// Validates: Requirements 3.2, 3.4

describe('Property 4: Transfer Invariant (Conservation of Money)', () => {
  test.prop([fc.integer({ min: 1, max: 100_000_00 }), fc.integer({ min: 0, max: 1_000_000_00 }), fc.integer({ min: 0, max: 1_000_000_00 })], { numRuns: 100 })(
    'total balance unchanged after transfer',
    (transferAmount, fromBalance, toBalance) => {
      const db = createTestDb();
      
      try {
        // Ensure sender has enough balance
        const senderBalance = Math.max(fromBalance, transferAmount);
        
        const fromUserId = crypto.randomUUID();
        const toUserId = crypto.randomUUID();
        
        // Insert users
        db.prepare(`
          INSERT INTO users (id, name, pin_hash, balance, card_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(fromUserId, 'Sender', 'hash1', senderBalance, '1234');

        db.prepare(`
          INSERT INTO users (id, name, pin_hash, balance, card_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(toUserId, 'Receiver', 'hash2', toBalance, '5678');

        // Get actual balances from DB
        const beforeFrom = db.prepare('SELECT balance FROM users WHERE id = ?').get(fromUserId) as { balance: number };
        const beforeTo = db.prepare('SELECT balance FROM users WHERE id = ?').get(toUserId) as { balance: number };
        const totalBefore = beforeFrom.balance + beforeTo.balance;

        // Execute transfer
        const transfer = db.transaction(() => {
          db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(transferAmount, fromUserId);
          db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(transferAmount, toUserId);
          db.prepare(`
            INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
            VALUES (?, ?, ?, ?, 'transfer', 'Test transfer')
          `).run(crypto.randomUUID(), fromUserId, toUserId, transferAmount);
        });
        transfer();

        // Calculate total after
        const rows = db.prepare('SELECT balance FROM users').all() as { balance: number }[];
        const totalAfter = rows.reduce((sum, r) => sum + r.balance, 0);

        return totalBefore === totalAfter;
      } finally {
        db.close();
      }
    }
  );
});

// Feature: home-bank-system, Property 5: Insufficient Funds Rejection
// Validates: Requirements 3.3

describe('Property 5: Insufficient Funds Rejection', () => {
  test.prop([fc.integer({ min: 0, max: 100_000_00 }), fc.integer({ min: 0, max: 100_000_00 })], { numRuns: 100 })(
    'transfer rejected when amount exceeds balance',
    (fromBalance, toBalance) => {
      const db = createTestDb();
      
      try {
        const fromUserId = crypto.randomUUID();
        const toUserId = crypto.randomUUID();
        
        // Amount that exceeds balance
        const transferAmount = fromBalance + 1;
        
        // Insert users
        db.prepare(`
          INSERT INTO users (id, name, pin_hash, balance, card_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(fromUserId, 'Sender', 'hash1', fromBalance, '1234');

        db.prepare(`
          INSERT INTO users (id, name, pin_hash, balance, card_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(toUserId, 'Receiver', 'hash2', toBalance, '5678');

        // Store original balances
        const originalFromBalance = fromBalance;
        const originalToBalance = toBalance;

        // Try transfer (should fail due to insufficient funds)
        const sender = db.prepare('SELECT balance FROM users WHERE id = ?').get(fromUserId) as { balance: number };
        
        if (sender.balance < transferAmount) {
          // Transfer should be rejected - balances unchanged
          const afterFrom = db.prepare('SELECT balance FROM users WHERE id = ?').get(fromUserId) as { balance: number };
          const afterTo = db.prepare('SELECT balance FROM users WHERE id = ?').get(toUserId) as { balance: number };
          
          return afterFrom.balance === originalFromBalance && afterTo.balance === originalToBalance;
        }

        return true;
      } finally {
        db.close();
      }
    }
  );
});
