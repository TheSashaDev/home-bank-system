import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { TransactionItem } from '../ui/TransactionItem'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import type { Transaction } from '../../types'
import { formatAmount, formatDate, getTypeLabel } from '../../utils/transactionDisplay'

export function HistoryScreen() {
  const { user, transactions, users, loading, error, fetchHistory, fetchUsers, setScreen } = useAppStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchHistory()
    fetchUsers()
  }, [fetchHistory, fetchUsers])

  const getUserName = (userId: string | null): string | undefined => {
    if (!userId) return undefined
    return users.find(u => u.id === userId)?.name
  }

  const getCounterpartyName = (tx: Transaction): string | undefined => {
    if (!user) return undefined
    if (tx.type === 'deposit') return undefined
    const isIncoming = tx.toUserId === user.id
    return isIncoming ? getUserName(tx.fromUserId) : getUserName(tx.toUserId)
  }

  const handleTxClick = (tx: Transaction) => {
    setSelectedTx(tx)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  return (
    <ATMLayout title="ІСТОРІЯ">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Історія операцій</h1>
        </motion.div>

        <Card variant="glass" padding="md">
          {loading ? (
            <div className="flex justify-center py-8">
              <motion.div
                className="w-10 h-10 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : error ? (
            <p className="text-[#f85149] text-center py-4">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-[#8b949e] text-center py-8">Немає транзакцій</p>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <TransactionItem
                    transaction={tx}
                    currentUserId={user?.id || ''}
                    counterpartyName={getCounterpartyName(tx)}
                    onClick={() => handleTxClick(tx)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Button onClick={() => setScreen('main')} variant="ghost">
            ← Назад до меню
          </Button>
        </motion.div>

        {/* Detail modal */}
        <AnimatePresence>
          {selectedTx && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
              onClick={() => setSelectedTx(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Card variant="elevated" padding="lg" className="w-full max-w-sm">
                  <h2 className="text-xl font-bold text-white mb-4">Деталі транзакції</h2>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Тип:</span>
                      <span className="text-white">{getTypeLabel(selectedTx.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Сума:</span>
                      <span className={`font-semibold ${selectedTx.toUserId === user?.id ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                        {formatAmount(selectedTx.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Дата:</span>
                      <span className="text-white">{formatDate(selectedTx.createdAt)}</span>
                    </div>
                    {selectedTx.fromUserId && (
                      <div className="flex justify-between">
                        <span className="text-[#8b949e]">Від:</span>
                        <span className="text-white">{getUserName(selectedTx.fromUserId) || 'Невідомо'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Кому:</span>
                      <span className="text-white">{getUserName(selectedTx.toUserId) || 'Невідомо'}</span>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedTx(null)} fullWidth className="mt-6">
                    Закрити
                  </Button>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ATMLayout>
  )
}
