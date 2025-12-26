import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import { formatAmount } from '../../../utils/transactionDisplay'

type Tx = {
  id: string
  from_user_id: string | null
  to_user_id: string | null
  from_name: string | null
  to_name: string | null
  amount: number
  type: string
  description: string
  created_at: string
}

export function AdminTransactionsScreen() {
  const { setScreen } = useAppStore()
  const [txs, setTxs] = useState<Tx[]>([])
  const [page, setPage] = useState(0)

  useEffect(() => {
    api.getAllTransactions().then(res => {
      if (res.success && res.data) setTxs(res.data)
    })
  }, [])

  const perPage = 8
  const paginated = txs.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(txs.length / perPage)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer': return '↔️'
      case 'deposit': return '💵'
      case 'withdrawal': return '💸'
      case 'credit': return '🏦'
      case 'credit_payment': return '💳'
      case 'savings_deposit': return '📥'
      case 'savings_withdrawal': return '📤'
      case 'debt_given': return '🤝'
      case 'debt_payment': return '✅'
      default: return '📝'
    }
  }

  return (
    <ATMLayout title="ТРАНЗАКЦІЇ">
      <div className="flex flex-col w-full max-w-4xl h-full">
        <div className="flex-1 overflow-hidden">
          <div className="grid gap-2">
            {paginated.map(tx => (
              <div key={tx.id} className="bg-[#21262d] rounded-lg p-2 flex items-center gap-3 text-xs">
                <span className="text-lg">{getTypeIcon(tx.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">
                    {tx.from_name || 'Система'} → {tx.to_name || 'Система'}
                  </p>
                  <p className="text-[#8b949e] truncate">{tx.description || tx.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#3fb950] font-bold">{formatAmount(tx.amount)}</p>
                  <p className="text-[#8b949e]">{new Date(tx.created_at).toLocaleDateString('uk')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#30363d]">
          <Button onClick={() => setScreen('admin')} variant="ghost" size="sm">← Назад</Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} size="sm" variant="secondary">
              ←
            </Button>
            <span className="text-[#8b949e] text-xs">{page + 1} / {totalPages || 1}</span>
            <Button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} size="sm" variant="secondary">
              →
            </Button>
          </div>
        </div>
      </div>
    </ATMLayout>
  )
}
