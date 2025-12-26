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
import type { Savings } from '../../types'

type Step = 'main' | 'deposit' | 'withdraw' | 'success'

export function SavingsScreen() {
  const { setScreen, balance, fetchBalance } = useAppStore()
  const [step, setStep] = useState<Step>('main')
  const [savings, setSavings] = useState<Savings | null>(null)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchSavings = async () => {
    const res = await api.getMySavings()
    if (res.success && res.data) setSavings(res.data)
  }

  useEffect(() => {
    fetchSavings()
    fetchBalance()
  }, [])

  const handleDeposit = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.depositToSavings(amount, pin)
    if (res.success) {
      setSuccessMsg(`${formatAmount(amount)} додано на депозит`)
      setStep('success')
      fetchSavings()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const handleWithdraw = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.withdrawFromSavings(amount, pin)
    if (res.success) {
      setSuccessMsg(`${formatAmount(amount)} знято з депозиту`)
      setStep('success')
      fetchSavings()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const yearlyEarnings = savings ? Math.round(savings.amount * savings.interestRate) : 0

  return (
    <ATMLayout title="ДЕПОЗИТ">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'main' && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Мій депозит</h1>
              <Card variant="glass" padding="lg">
                <div className="text-center mb-6">
                  <p className="text-[#8b949e] mb-2">На депозиті</p>
                  <p className="text-4xl font-bold text-[#3fb950]">{formatAmount(savings?.amount || 0)}</p>
                  <p className="text-[#8b949e] mt-2">
                    {savings?.interestRate ? `${(savings.interestRate * 100).toFixed(0)}% річних` : '8% річних'}
                  </p>
                  {yearlyEarnings > 0 && (
                    <p className="text-sm text-[#8b949e] mt-1">
                      ~{formatAmount(yearlyEarnings)} на рік
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => { setAmount(0); setStep('deposit') }} variant="primary" fullWidth size="lg">
                    Поповнити
                  </Button>
                  <Button 
                    onClick={() => { setAmount(0); setStep('withdraw') }} 
                    variant="secondary" 
                    fullWidth 
                    size="lg"
                    disabled={!savings || savings.amount <= 0}
                  >
                    Зняти
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'deposit' && (
            <motion.div key="deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Поповнення</h1>
              <Card variant="glass" padding="lg">
                <AmountInput 
                  value={amount} 
                  onChange={setAmount} 
                  maxAmount={balance ?? undefined} 
                  label={`Доступно: ${formatAmount(balance || 0)}`} 
                />
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-[#8b949e] text-center my-4">Введіть PIN</p>
                    <PinPad onComplete={handleDeposit} error={error || undefined} />
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {step === 'withdraw' && (
            <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Зняття</h1>
              <Card variant="glass" padding="lg">
                <AmountInput 
                  value={amount} 
                  onChange={setAmount} 
                  maxAmount={savings?.amount} 
                  label={`На депозиті: ${formatAmount(savings?.amount || 0)}`} 
                />
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-[#8b949e] text-center my-4">Введіть PIN</p>
                    <PinPad onComplete={handleWithdraw} error={error || undefined} />
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-6">✅</motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Успішно!</h1>
              <p className="text-[#8b949e] mb-8">{successMsg}</p>
              <Button onClick={() => { setStep('main'); fetchSavings() }} fullWidth size="lg">OK</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <Button onClick={() => step === 'main' ? setScreen('main') : setStep('main')} variant="ghost">← Назад</Button>
          </motion.div>
        )}
      </div>
    </ATMLayout>
  )
}
