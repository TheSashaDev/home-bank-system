import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import type { User } from '../../../types'

export function UsersScreen() {
  const { setScreen } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    const res = await api.getAllUsers()
    if (res.success && res.data) {
      setUsers(res.data)
    } else {
      setError(res.error || 'Помилка завантаження')
    }
    setLoading(false)
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
      setError('Помилка завантаження PDF')
    }
  }

  const downloadCard = async (userId: string, cardNumber: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/card-pdf/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `card-${cardNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Помилка завантаження PDF')
    }
  }

  const formatAmt = (kopecks: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(kopecks / 100)
  }

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0)

  return (
    <ATMLayout title="КОРИСТУВАЧІ">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-white mb-2">👥 Всі користувачі</h1>
        </motion.div>

        <Card variant="glass" padding="lg">
          {loading ? (
            <div className="flex justify-center py-8">
              <motion.div
                className="w-10 h-10 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-[#f85149] mb-4">{error}</p>
              <Button onClick={loadUsers} variant="secondary">Спробувати знову</Button>
            </div>
          ) : (
            <>
              <div className="bg-[#21262d] rounded-xl p-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Всього:</span>
                  <span className="text-white font-semibold">{users.length}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[#8b949e]">Баланс:</span>
                  <span className="text-[#3fb950] font-semibold">{formatAmt(totalBalance)}</span>
                </div>
              </div>

              <Button onClick={downloadAllCards} variant="primary" fullWidth className="mb-4">
                📥 Завантажити всі картки (PDF)
              </Button>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {users.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-[#21262d] rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{user.isAdmin ? '👑' : '👤'}</span>
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {user.name}
                            {user.isAdmin && <span className="text-xs text-[#ff6b9d]">Адмін</span>}
                            {user.isBlocked && <span className="text-xs text-[#f85149]">🔒</span>}
                          </p>
                          <p className="text-[#484f58] text-sm font-mono">*{user.cardNumber}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${user.balance >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                        {formatAmt(user.balance)}
                      </span>
                    </div>
                    <Button onClick={() => downloadCard(user.id, user.cardNumber)} variant="secondary" size="sm" fullWidth>
                      📄 Завантажити картку
                    </Button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </Card>

        <motion.div className="mt-8 text-center">
          <Button onClick={() => setScreen('admin')} variant="ghost">
            ← Назад
          </Button>
        </motion.div>
      </div>
    </ATMLayout>
  )
}
