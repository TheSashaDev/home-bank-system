import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getTransactionDisplayData, formatAmount, formatDate, getTypeLabel } from './transactionDisplay'
import type { Transaction, TransactionType } from '../types'

// Feature: home-bank-system, Property 7: Transaction Display Completeness
// **Validates: Requirements 4.2**

const transactionTypeArb = fc.constantFrom<TransactionType>('transfer', 'deposit', 'withdrawal')

const transactionArb = fc.record({
  id: fc.uuid(),
  fromUserId: fc.option(fc.uuid(), { nil: null }),
  toUserId: fc.uuid(),
  amount: fc.integer({ min: 1, max: 100000000 }), // 1 kopeck to 1M UAH
  type: transactionTypeArb,
  description: fc.option(fc.string(), { nil: null }),
  createdAt: fc.integer({ min: 1577836800, max: 1893456000 }), // 2020-2030
})

describe('Transaction Display - Property 7: Transaction Display Completeness', () => {
  it('should always include date, amount, type label, and counterparty info for any transaction', () => {
    fc.assert(
      fc.property(
        transactionArb,
        fc.uuid(),
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (transaction, currentUserId, counterpartyName) => {
          const display = getTransactionDisplayData(transaction, currentUserId, counterpartyName)

          // Must have type label (non-empty string)
          expect(display.typeLabel).toBeTruthy()
          expect(typeof display.typeLabel).toBe('string')
          expect(display.typeLabel.length).toBeGreaterThan(0)

          // Must have formatted amount (non-empty string with numbers)
          expect(display.formattedAmount).toBeTruthy()
          expect(typeof display.formattedAmount).toBe('string')
          expect(/\d/.test(display.formattedAmount)).toBe(true)

          // Must have formatted date (non-empty string)
          expect(display.formattedDate).toBeTruthy()
          expect(typeof display.formattedDate).toBe('string')
          expect(display.formattedDate.length).toBeGreaterThan(0)

          // isPositive must be boolean
          expect(typeof display.isPositive).toBe('boolean')

          // counterpartyLabel should be string or null
          if (counterpartyName) {
            expect(display.counterpartyLabel).toBeTruthy()
            expect(display.counterpartyLabel).toContain(counterpartyName)
          } else {
            expect(display.counterpartyLabel).toBeNull()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('formatAmount should produce valid currency string for any positive amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000000 }), (kopecks) => {
        const result = formatAmount(kopecks)
        expect(typeof result).toBe('string')
        // should contain digits
        expect(/\d/.test(result)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('formatDate should produce valid date string for any timestamp', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1577836800, max: 1893456000 }), (timestamp) => {
        const result = formatDate(timestamp)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        // should contain date-like patterns (digits and separators)
        expect(/\d/.test(result)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('getTypeLabel should return valid label for all transaction types', () => {
    const types: TransactionType[] = ['transfer', 'deposit', 'withdrawal']
    for (const type of types) {
      const label = getTypeLabel(type)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})
