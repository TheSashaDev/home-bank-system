import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import { formatAmount } from '../../../utils/transactionDisplay'

type CreditRow = {
  id: string
  user_id: string
  user_name: string
  amount: number
  remaining_amount: number
  monthly_payment: number
  months: number
  status: string
  created_at: string
}

export function CreditsAdminScreen() {
  const { setScreen } = useAppStore()
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCredits = async () => {
    const res = await api.getAllCredits()
    if (res.success && res.data) setCredits(res.data)
  }

  useEffect(() => { fetchCredits() }, [])

  const handleForgive = async (creditId: string) => {
    if (!confirm('Списати кредит?')) return
    setLoading(true)
    await api.forgiveCredit(creditId)
    await fetchCredits()
    setLoading(false)
  }

  const active = credits.filter(c => c.status === 'active')
  const paid = credits.filter(c => c.status === 'paid')

  return (
    <ATMLayout title="КРЕДИТИ">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Active credits */}
        <div className="flex-1 flex flex-col">
          <p className="text-[#ff6b9d] text-xs mb-2">🔴 Активні ({active.length})</p>
          <div className="flex flex-col gap-2 overflow-hidden">
            {active.slice(0, 5).map(c => (
              <div key={c.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-white font-medium">{c.user_name}</span>
                  <span className="text-[#f85149]">{formatAmount(c.remaining_amount)}</span>
                </div>
                <div className="flex justify-between text-[#8b949e] mb-2">
                  <span>Щомісяця: {formatAmount(c.monthly_payment)}</span>
                  <span>{c.months} міс</span>
                </div>
                <Button onClick={() => handleForgive(c.id)} size="sm" variant="secondary" fullWidth disabled={loading}>
                  Списати
                </Button>
              </div>
            ))}
            {active.length === 0 && <p className="text-[#8b949e] text-xs">Немає активних</p>}
          </div>
        </div>

        {/* Paid credits */}
        <div className="w-48 flex flex-col">
          <p className="text-[#3fb950] text-xs mb-2">✅ Погашені ({paid.length})</p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {paid.slice(0, 6).map(c => (
              <div key={c.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                <p className="text-white">{c.user_name}</p>
                <p className="text-[#8b949e]">{formatAmount(c.amount)}</p>
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
