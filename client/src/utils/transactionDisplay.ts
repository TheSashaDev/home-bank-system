import type { Transaction, TransactionType } from '../types'

export function formatAmount(kopecks: number): string {
  const hryvnias = kopecks / 100
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(hryvnias)
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

export function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case 'deposit': return 'Поповнення'
    case 'withdrawal': return 'Зняття'
    case 'transfer': return 'Переказ'
  }
}

export interface TransactionDisplayData {
  typeLabel: string
  formattedAmount: string
  formattedDate: string
  isPositive: boolean
  counterpartyLabel: string | null
}

export function getTransactionDisplayData(
  transaction: Transaction,
  currentUserId: string,
  counterpartyName?: string
): TransactionDisplayData {
  const isIncoming = transaction.toUserId === currentUserId
  const isDeposit = transaction.type === 'deposit'
  const showPositive = isDeposit || (transaction.type === 'transfer' && isIncoming)

  let counterpartyLabel: string | null = null
  if (counterpartyName) {
    counterpartyLabel = `${isIncoming ? 'від' : 'до'} ${counterpartyName}`
  }

  return {
    typeLabel: getTypeLabel(transaction.type),
    formattedAmount: formatAmount(transaction.amount),
    formattedDate: formatDate(transaction.createdAt),
    isPositive: showPositive,
    counterpartyLabel,
  }
}
