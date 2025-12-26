import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AmountInput } from '../ui/AmountInput'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'
import { formatAmount } from '../../utils/transactionDisplay'

type Step = 'select' | 'amount' | 'confirm' | 'success'

export function TransferScreen() {
  const { user, users, balance, fetchUsers, fetchBalance, setScreen } = useAppStore()
  const [step, setStep] = useState<Step>('select')
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchBalance()
  }, [fetchUsers, fetchBalance])

  const handleSelectUser = (u: { id: string; name: string }) => {
    setSelectedUser(u)
    setStep('amount')
    if (navigator.vibrate) navigator.vibrate(20)
  }

  const handleAmountConfirm = () => {
    if (amount <= 0) {
      setError('Введіть суму')
      return
    }
    if (balance !== null && amount > balance) {
      setError('Недостатньо коштів')
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handlePinComplete = async (pin: string) => {
    if (!selectedUser) return

    setLoading(true)
    setError(null)

    const res = await api.transfer(selectedUser.id, amount, pin)

    if (res.success) {
      if (navigator.vibrate) navigator.vibrate(100)
      setStep('success')
      fetchBalance()
    } else {
      setError(res.error || 'Помилка переказу')
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    }

    setLoading(false)
  }

  const handleBack = () => {
    if (step === 'amount') setStep('select')
    else if (step === 'confirm') setStep('amount')
    else setScreen('main')
  }

  const filteredUsers = users.filter(u => u.id !== user?.id)

  const getTitle = () => {
    switch (step) {
      case 'select': return 'ПЕРЕКАЗ'
      case 'amount': return 'СУМА'
      case 'confirm': return 'ПІДТВЕРДЖЕННЯ'
      case 'success': return 'УСПІХ'
    }
  }

  return (
    <ATMLayout title={getTitle()}>
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Оберіть отримувача</h1>
              <Card variant="glass" padding="md">
                <div className="flex flex-col gap-3">
                  {filteredUsers.length === 0 ? (
                    <p className="text-[#8b949e] text-center py-4">Немає отримувачів</p>
                  ) : (
                    filteredUsers.map(u => (
                      <Button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        variant="secondary"
                        fullWidth
                        className="justify-between"
                      >
                        <span>{u.name}</span>
                        <span className="text-[#484f58] text-sm">*{u.cardNumber}</span>
                      </Button>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'amount' && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Сума переказу</h1>
              <p className="text-[#8b949e] text-center mb-6">для {selectedUser?.name}</p>
              <Card variant="glass" padding="lg">
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  maxAmount={balance ?? undefined}
                  label={`Доступно: ${formatAmount(balance ?? 0)}`}
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#f85149] text-center mt-4">
                    {error}
                  </motion.p>
                )}
                <Button onClick={handleAmountConfirm} fullWidth size="lg" className="mt-6">
                  Далі
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Підтвердіть PIN</h1>
              <p className="text-[#8b949e] text-center mb-6">
                {formatAmount(amount)} → {selectedUser?.name}
              </p>
              <Card variant="glass" padding="lg">
                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <motion.div
                      className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-[#8b949e]">Обробка...</p>
                  </div>
                ) : (
                  <PinPad onComplete={handlePinComplete} error={error || undefined} />
                )}
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="text-8xl mb-6"
              >
                ✅
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Успішно!</h1>
              <p className="text-[#8b949e] mb-8">
                {formatAmount(amount)} переказано на рахунок {selectedUser?.name}
              </p>
              <Button onClick={() => setScreen('main')} fullWidth size="lg">
                До меню
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <Button onClick={handleBack} variant="ghost">
              ← Назад
            </Button>
          </motion.div>
        )}
      </div>
    </ATMLayout>
  )
}
