import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { AmountInput } from '../../ui/AmountInput'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'
import type { User } from '../../../types'

export function DepositScreen() {
  const { setScreen } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ name: string; amount: number; newBalance: number } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoadingUsers(true)
    const res = await api.getAllUsers()
    if (res.success && res.data) {
      setUsers(res.data.filter(u => !u.isAdmin))
    }
    setLoadingUsers(false)
  }

  const handleDeposit = async () => {
    if (!selectedUser) {
      setError('Оберіть користувача')
      return
    }
    if (amount <= 0) {
      setError('Введіть суму')
      return
    }

    setLoading(true)
    setError(null)

    const res = await api.deposit(selectedUser.id, amount)
    
    if (res.success && res.data) {
      setSuccess({ name: selectedUser.name, amount, newBalance: res.data.newBalance })
      setSelectedUser(null)
      setAmount(0)
    } else {
      setError(res.error || 'Помилка поповнення')
    }
    setLoading(false)
  }

  const formatAmt = (kopecks: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(kopecks / 100)
  }

  if (success) {
    return (
      <ATMLayout title="ПОПОВНЕНО">
        <div className="w-full max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-6">✅</motion.div>
          
          <Card variant="elevated" padding="lg">
            <h2 className="text-2xl font-bold text-white mb-4">Поповнено!</h2>
            <p className="text-[#8b949e] mb-2">Рахунок: {success.name}</p>
            <p className="text-3xl font-bold text-[#3fb950] mb-2">+{formatAmt(success.amount)}</p>
            <p className="text-[#484f58]">Новий баланс: {formatAmt(success.newBalance)}</p>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setSuccess(null)} variant="primary" fullWidth>
                Поповнити ще
              </Button>
              <Button onClick={() => setScreen('admin')} variant="secondary" fullWidth>
                Готово
              </Button>
            </div>
          </Card>
        </div>
      </ATMLayout>
    )
  }

  return (
    <ATMLayout title="ПОПОВНЕННЯ">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">💵 Поповнити рахунок</h1>
        </motion.div>

        <Card variant="glass" padding="lg">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <motion.div
                className="w-10 h-10 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[#8b949e] text-sm mb-2">Користувач</label>
                <div className="grid gap-2">
                  {users.map(u => (
                    <motion.button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors
                        ${selectedUser?.id === u.id 
                          ? 'bg-[#ff6b9d]/20 border-2 border-[#ff6b9d]' 
                          : 'bg-[#21262d] border-2 border-transparent hover:bg-[#30363d]'}`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-white">{u.name}</span>
                      <span className="text-[#484f58] text-sm">{formatAmt(u.balance)}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#8b949e] text-sm mb-2">Сума</label>
                <AmountInput value={amount} onChange={setAmount} />
              </div>

              {error && <p className="text-[#f85149] text-center">{error}</p>}

              <Button
                onClick={handleDeposit}
                variant="primary"
                fullWidth
                size="lg"
                disabled={loading || !selectedUser || amount <= 0}
              >
                {loading ? 'Поповнення...' : `Поповнити ${amount > 0 ? formatAmt(amount) : ''}`}
              </Button>
            </div>
          )}
        </Card>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
          <Button onClick={() => setScreen('admin')} variant="ghost">
            ← Назад
          </Button>
        </motion.div>
      </div>
    </ATMLayout>
  )
}
