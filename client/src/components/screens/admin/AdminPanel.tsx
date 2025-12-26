import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import { formatAmount } from '../../../utils/transactionDisplay'

type Stats = {
  totalUsers: number
  totalBalance: number
  totalCredits: number
  totalSavings: number
  totalDebts: number
  txToday: number
}

export function AdminPanel() {
  const { setScreen } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.getStats().then(res => {
      if (res.success && res.data) setStats(res.data)
    })
  }, [])

  const downloadATMTemplate = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/atm-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'atm-template.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Помилка завантаження')
    }
  }

  const downloadAllCards = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/cards-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'all-cards.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Помилка завантаження')
    }
  }


  return (
    <ATMLayout title="АДМІН">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Left: Stats */}
        <div className="w-56 flex flex-col">
          <p className="text-[#8b949e] text-xs mb-2">📊 Статистика</p>
          {stats && (
            <div className="bg-[#21262d] rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Користувачів</span>
                <span className="text-white">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Всього грошей</span>
                <span className="text-[#3fb950]">{formatAmount(stats.totalBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Кредитів</span>
                <span className="text-[#ff6b9d]">{formatAmount(stats.totalCredits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Депозитів</span>
                <span className="text-[#58a6ff]">{formatAmount(stats.totalSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Боргів</span>
                <span className="text-[#f85149]">{formatAmount(stats.totalDebts)}</span>
              </div>
              <div className="flex justify-between border-t border-[#30363d] pt-2">
                <span className="text-[#8b949e]">Транзакцій сьогодні</span>
                <span className="text-white">{stats.txToday}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Menu */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            <button onClick={() => setScreen('admin-users')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">👥</span>
              <p className="text-white text-sm mt-1">Користувачі</p>
            </button>
            <button onClick={() => setScreen('admin-create')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">🆕</span>
              <p className="text-white text-sm mt-1">Нова картка</p>
            </button>
            <button onClick={() => setScreen('admin-deposit')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">💵</span>
              <p className="text-white text-sm mt-1">Поповнити</p>
            </button>
            <button onClick={() => setScreen('admin-transactions')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">📜</span>
              <p className="text-white text-sm mt-1">Транзакції</p>
            </button>
            <button onClick={() => setScreen('admin-credits')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">🏦</span>
              <p className="text-white text-sm mt-1">Кредити</p>
            </button>
            <button onClick={() => setScreen('admin-debts')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">🤝</span>
              <p className="text-white text-sm mt-1">Борги</p>
            </button>
            <button onClick={() => setScreen('admin-withdrawals')} className="bg-[#21262d] rounded-lg p-4 text-left hover:bg-[#30363d]">
              <span className="text-2xl">💳</span>
              <p className="text-white text-sm mt-1">Виводи</p>
            </button>
          </div>
        </div>

        {/* Right: Downloads */}
        <div className="w-40 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[#8b949e] text-xs mb-2">📥 Завантажити</p>
            <Button onClick={downloadATMTemplate} variant="secondary" size="sm" fullWidth>
              🏧 Банкомат PDF
            </Button>
            <Button onClick={downloadAllCards} variant="secondary" size="sm" fullWidth>
              💳 Всі картки PDF
            </Button>
          </div>
          <Button onClick={() => setScreen('main')} variant="ghost" size="sm">← Назад</Button>
        </div>
      </div>
    </ATMLayout>
  )
}
