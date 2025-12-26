import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import { formatAmount } from '../../../utils/transactionDisplay'

type DebtRow = {
  id: string
  from_user_id: string
  to_user_id: string
  from_name: string
  to_name: string
  amount: number
  remaining_amount: number
  status: string
  description: string
  created_at: string
}

export function DebtsAdminScreen() {
  const { setScreen } = useAppStore()
  const [debts, setDebts] = useState<DebtRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDebts = async () => {
    const res = await api.getAllDebts()
    if (res.success && res.data) setDebts(res.data)
  }

  useEffect(() => { fetchDebts() }, [])

  const handleForgive = async (debtId: string) => {
    if (!confirm('Списати борг?')) return
    setLoading(true)
    await api.forgiveDebt(debtId)
    await fetchDebts()
    setLoading(false)
  }

  const active = debts.filter(d => d.status === 'accepted')
  const pending = debts.filter(d => d.status === 'pending')
  const paid = debts.filter(d => d.status === 'paid')

  return (
    <ATMLayout title="БОРГИ">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Active debts */}
        <div className="flex-1 flex flex-col">
          <p className="text-[#f85149] text-xs mb-2">🔴 Активні ({active.length})</p>
          <div className="flex flex-col gap-2 overflow-hidden">
            {active.slice(0, 4).map(d => (
              <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-white">{d.from_name} → {d.to_name}</span>
                  <span className="text-[#f85149]">{formatAmount(d.remaining_amount)}</span>
                </div>
                {d.description && <p className="text-[#8b949e] mb-2">{d.description}</p>}
                <Button onClick={() => handleForgive(d.id)} size="sm" variant="secondary" fullWidth disabled={loading}>
                  Списати
                </Button>
              </div>
            ))}
            {active.length === 0 && <p className="text-[#8b949e] text-xs">Немає активних</p>}
          </div>
        </div>

        {/* Pending */}
        <div className="w-40 flex flex-col">
          <p className="text-[#ff6b9d] text-xs mb-2">⏳ Очікують ({pending.length})</p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {pending.slice(0, 4).map(d => (
              <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <p className="text-white">{d.from_name}</p>
                <p className="text-[#8b949e]">{formatAmount(d.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Paid */}
        <div className="w-32 flex flex-col">
          <p className="text-[#3fb950] text-xs mb-2">✅ Сплачені ({paid.length})</p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {paid.slice(0, 4).map(d => (
              <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <p className="text-white">{d.from_name}</p>
                <p className="text-[#8b949e]">{formatAmount(d.amount)}</p>
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
