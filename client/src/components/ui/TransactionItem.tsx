import { motion } from 'framer-motion'
import type { Transaction } from '../../types'
import { getTransactionDisplayData } from '../../utils/transactionDisplay'

interface TransactionItemProps {
  transaction: Transaction
  currentUserId: string
  counterpartyName?: string
  onClick?: () => void
}

export function TransactionItem({
  transaction,
  currentUserId,
  counterpartyName,
  onClick,
}: TransactionItemProps) {
  const display = getTransactionDisplayData(transaction, currentUserId, counterpartyName)

  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-[#2d2d2d]/60 rounded-xl cursor-pointer border border-[#3d3d3d]/30"
      onClick={onClick}
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(61, 61, 61, 0.6)' }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-white font-medium">
          {display.typeLabel}
          {display.counterpartyLabel && (
            <span className="text-[#a0a0a0] font-normal">
              {' '}{display.counterpartyLabel}
            </span>
          )}
        </span>
        <span className="text-[#6b6b6b] text-sm">
          {display.formattedDate}
        </span>
      </div>

      <span className={`text-lg font-semibold ${display.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
        {display.isPositive ? '+' : '-'}{display.formattedAmount}
      </span>
    </motion.div>
  )
}
