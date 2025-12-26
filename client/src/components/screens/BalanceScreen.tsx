import { useEffect } from 'react'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

export function BalanceScreen() {
  const { balance, loading, fetchBalance, setScreen } = useAppStore()

  useEffect(() => { fetchBalance() }, [])

  return (
    <ATMLayout title="БАЛАНС">
      <div className="text-center">
        {loading ? (
          <div className="w-10 h-10 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <>
            <p className="text-[#8b949e] text-sm mb-2">Ваш баланс</p>
            <div className="text-4xl font-bold text-[#ff6b9d] mb-4">
              {((balance || 0) / 100).toFixed(2)} ₴
            </div>
          </>
        )}
        <button onClick={() => setScreen('main')} className="px-6 py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-sm">
          ← Назад
        </button>
      </div>
    </ATMLayout>
  )
}
