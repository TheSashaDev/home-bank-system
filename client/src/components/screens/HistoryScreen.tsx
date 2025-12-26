import { useEffect } from 'react'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

export function HistoryScreen() {
  const { user, transactions, users, loading, fetchHistory, fetchUsers, setScreen } = useAppStore()

  useEffect(() => {
    fetchHistory()
    fetchUsers()
  }, [])

  const getName = (id: string | null) => users.find(u => u.id === id)?.name || '?'

  return (
    <ATMLayout title="ІСТОРІЯ">
      <div className="w-full max-w-3xl flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-[#8b949e] text-center py-4">Немає транзакцій</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {transactions.slice(0, 8).map(tx => {
                const isIncoming = tx.toUserId === user?.id
                return (
                  <div key={tx.id} className="bg-[#21262d] rounded-lg px-3 py-2 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm">{tx.type === 'transfer' ? (isIncoming ? `від ${getName(tx.fromUserId)}` : `до ${getName(tx.toUserId)}`) : tx.type}</p>
                      <p className="text-[#8b949e] text-xs">{new Date(tx.createdAt * 1000).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold ${isIncoming ? 'text-green-500' : 'text-red-500'}`}>
                      {isIncoming ? '+' : '-'}{(tx.amount / 100).toFixed(0)} ₴
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="mt-3 text-center">
          <button onClick={() => setScreen('main')} className="px-6 py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-sm">
            ← Назад
          </button>
        </div>
      </div>
    </ATMLayout>
  )
}
