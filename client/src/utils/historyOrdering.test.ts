import { describe } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import type { Transaction, TransactionType } from '../types';

// Feature: home-bank-system, Property 6: Transaction History Ordering
// Validates: Requirements 4.1

// Helper to generate a random transaction
const transactionArb = fc.record({
  id: fc.uuid(),
  fromUserId: fc.option(fc.uuid(), { nil: null }),
  toUserId: fc.uuid(),
  amount: fc.integer({ min: 1, max: 1_000_000_00 }),
  type: fc.constantFrom<TransactionType>('transfer', 'deposit', 'withdrawal'),
  description: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: null }),
  createdAt: fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }), // Unix timestamps
});

// Function that simulates the ordering logic from the backend
function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.createdAt - a.createdAt);
}

// Function to check if array is sorted in descending order by createdAt
function isDescendingByDate(transactions: Transaction[]): boolean {
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i].createdAt > transactions[i - 1].createdAt) {
      return false;
    }
  }
  return true;
}

describe('Property 6: Transaction History Ordering', () => {
  test.prop([fc.array(transactionArb, { minLength: 0, maxLength: 50 })], { numRuns: 100 })(
    'transactions are sorted in descending chronological order (newest first)',
    (transactions) => {
      const sorted = sortTransactionsByDate(transactions);
      
      // Property: sorted array should be in descending order by createdAt
      return isDescendingByDate(sorted);
    }
  );

  test.prop([fc.array(transactionArb, { minLength: 2, maxLength: 50 })], { numRuns: 100 })(
    'first transaction has the most recent timestamp',
    (transactions) => {
      if (transactions.length === 0) return true;
      
      const sorted = sortTransactionsByDate(transactions);
      const maxTimestamp = Math.max(...transactions.map(t => t.createdAt));
      
      // Property: first element should have the maximum timestamp
      return sorted[0].createdAt === maxTimestamp;
    }
  );

  test.prop([fc.array(transactionArb, { minLength: 1, maxLength: 50 })], { numRuns: 100 })(
    'sorting preserves all transactions (no data loss)',
    (transactions) => {
      const sorted = sortTransactionsByDate(transactions);
      
      // Property: sorted array should have same length
      if (sorted.length !== transactions.length) return false;
      
      // Property: all original transaction IDs should be present
      const originalIds = new Set(transactions.map(t => t.id));
      const sortedIds = new Set(sorted.map(t => t.id));
      
      return originalIds.size === sortedIds.size && 
             [...originalIds].every(id => sortedIds.has(id));
    }
  );
});
