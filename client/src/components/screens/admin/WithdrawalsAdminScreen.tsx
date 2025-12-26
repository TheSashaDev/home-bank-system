import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import { formatAmount } from '../../../utils/transactionDisplay'

type WithdrawalRequest = {
  id: string
  userId: string
  userName: string
  amount: number
  cardNumber: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment: string | null
  createdAt: string
}

export function WithdrawalsAdminScreen() {
  const { setScreen } = useAppStore()
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchRequests = async () => {
    const res = await api.getAllWithdrawals()
    if (res.success && res.data) setRequests(res.data)
  }

  useEffect(() => { fetchRequests() }, [])

  const handleProcess = async (requestId: string, approve: boolean) => {
    setLoading(true)
    await api.processWithdrawal(requestId, approve, comment || undefined)
    setComment('')
    setSelectedId(null)
    await fetchRequests()
    setLoading(false)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const processed = requests.filter(r => r.status !== 'pending')

  return (
    <ATMLayout title="ЗАПИТИ НА ВИВІД">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Pending */}
        <div className="flex-1 flex flex-col">
          <p className="text-yellow-400 text-xs mb-2">⏳ На розгляді ({pending.length})</p>
          <div className="flex flex-col gap-2 overflow-hidden">
            {pending.length === 0 ? (
              <p className="text-[#8b949e] text-xs">Немає запитів</p>
            ) : (
              pending.slice(0, 4).map(r => (
                <div key={r.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-medium">{r.userName}</span>
                    <span className="text-[#ff6b9d] font-bold">{formatAmount(r.amount)}</span>
                  </div>
                  <p className="text-[#8b949e] mb-2">💳 {r.cardNumber}</p>
                  {selectedId === r.id ? (
                    <>
                      <input
                        type="text"
                        placeholder="Коментар (необов'язково)"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-white text-xs mb-2"
                      />
                      <div className="flex gap-1">
                        <Button onClick={() => handleProcess(r.id, true)} size="sm" fullWidth disabled={loading}>
                          ✅ Схвалити
                        </Button>
                        <Button onClick={() => handleProcess(r.id, false)} variant="secondary" size="sm" fullWidth disabled={loading}>
                          ❌ Відхилити
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button onClick={() => { setSelectedId(r.id); setComment('') }} size="sm" fullWidth>
                      Розглянути
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Processed */}
        <div className="w-48 flex flex-col">
          <p className="text-[#8b949e] text-xs mb-2">📜 Оброблені ({processed.length})</p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {processed.slice(0, 6).map(r => (
              <div key={r.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white">{r.userName}</span>
                  <span className={r.status === 'approved' ? 'text-green-400' : 'text-red-400'}>
                    {r.status === 'approved' ? '✅' : '❌'}
                  </span>
                </div>
                <p className="text-[#8b949e]">{formatAmount(r.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="w-24 flex flex-col justify-end">
          <Button onClick={() => setScreen('admin')} variant="ghost" size="sm">← Назад</Button>
        </div>
      </div>
    </ATMLayout>
  )
}
