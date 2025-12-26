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
import type { Credit } from '../../types'

type Step = 'list' | 'take' | 'months' | 'confirm' | 'pay-amount' | 'pay-pin' | 'success'

export function CreditsScreen() {
  const { setScreen } = useAppStore()
  const [step, setStep] = useState<Step>('list')
  const [credits, setCredits] = useState<Credit[]>([])
  const [amount, setAmount] = useState(0)
  const [months, setMonths] = useState(6)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchCredits = async () => {
    const res = await api.getMyCredits()
    if (res.success && res.data) setCredits(res.data)
  }

  useEffect(() => { fetchCredits() }, [])

  const interestRate = 0.15
  const totalWithInterest = Math.round(amount * (1 + interestRate * (months / 12)))
  const monthlyPayment = Math.round(totalWithInterest / months)

  const handleTakeCredit = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.takeCredit(amount, months, pin)
    if (res.success) {
      setSuccessMsg(`Кредит ${formatAmount(amount)} оформлено!`)
      setStep('success')
      fetchCredits()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const handlePayCredit = async (pin: string) => {
    if (!selectedCredit) return
    setLoading(true)
    setError(null)
    const res = await api.payCredit(selectedCredit.id, payAmount, pin)
    if (res.success) {
      setSuccessMsg(`Сплачено ${formatAmount(payAmount)}`)
      setStep('success')
      fetchCredits()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const handleBack = () => {
    setError(null)
    switch (step) {
      case 'list': setScreen('main'); break
      case 'take': setStep('list'); break
      case 'months': setStep('take'); break
      case 'confirm': setStep('months'); break
      case 'pay-amount': setStep('list'); break
      case 'pay-pin': setStep('pay-amount'); break
      default: setStep('list')
    }
  }

  const activeCredits = credits.filter(c => c.status === 'active')

  return (
    <ATMLayout title="КРЕДИТИ">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Мої кредити</h1>
              <Card variant="glass" padding="lg">
                {activeCredits.length === 0 ? (
                  <p className="text-[#8b949e] text-center py-4">Немає активних кредитів</p>
                ) : (
                  <div className="flex flex-col gap-3 mb-4">
                    {activeCredits.map(c => (
                      <div key={c.id} className="bg-[#21262d] rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-[#8b949e]">Залишок</span>
                          <span className="text-white font-bold">{formatAmount(c.remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between mb-3">
                          <span className="text-[#8b949e]">Щомісяця</span>
                          <span className="text-[#ff6b9d]">{formatAmount(c.monthlyPayment)}</span>
                        </div>
                        <Button
                          onClick={() => { setSelectedCredit(c); setPayAmount(c.monthlyPayment); setError(null); setStep('pay-amount') }}
                          fullWidth size="sm"
                        >
                          Погасити
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={() => { setAmount(0); setStep('take') }} variant="primary" fullWidth size="lg">
                  Взяти кредит
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'take' && (
            <motion.div key="take" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Сума кредиту</h1>
              <Card variant="glass" padding="lg">
                <AmountInput value={amount} onChange={setAmount} maxAmount={10000000} label="Макс: 100,000 грн" />
                {amount > 0 && (
                  <p className="text-[#8b949e] text-center mt-4">Ставка: 15% річних</p>
                )}
                <Button onClick={() => setStep('months')} fullWidth size="lg" className="mt-6" disabled={amount <= 0}>
                  Далі
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'months' && (
            <motion.div key="months" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Термін кредиту</h1>
              <Card variant="glass" padding="lg">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[3, 6, 12, 18, 24].map(m => (
                    <Button
                      key={m}
                      onClick={() => setMonths(m)}
                      variant={months === m ? 'primary' : 'secondary'}
                    >
                      {m} міс
                    </Button>
                  ))}
                </div>
                <div className="bg-[#21262d] rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#8b949e]">Сума</span>
                    <span className="text-white">{formatAmount(amount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#8b949e]">До сплати</span>
                    <span className="text-white">{formatAmount(totalWithInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Щомісяця</span>
                    <span className="text-[#ff6b9d] font-bold">{formatAmount(monthlyPayment)}</span>
                  </div>
                </div>
                <Button onClick={() => setStep('confirm')} fullWidth size="lg">
                  Оформити
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Підтвердіть PIN</h1>
              <p className="text-[#8b949e] text-center mb-6">Кредит {formatAmount(amount)} на {months} міс.</p>
              <Card variant="glass" padding="lg">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <PinPad onComplete={handleTakeCredit} error={error || undefined} />
                )}
              </Card>
            </motion.div>
          )}

          {step === 'pay-amount' && selectedCredit && (
            <motion.div key="pay-amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Сума погашення</h1>
              <Card variant="glass" padding="lg">
                <AmountInput 
                  value={payAmount} 
                  onChange={setPayAmount} 
                  maxAmount={selectedCredit.remainingAmount} 
                  label={`Залишок: ${formatAmount(selectedCredit.remainingAmount)}`} 
                />
                <Button 
                  onClick={() => setStep('pay-pin')} 
                  fullWidth 
                  size="lg" 
                  className="mt-6"
                  disabled={payAmount <= 0}
                >
                  Далі
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'pay-pin' && selectedCredit && (
            <motion.div key="pay-pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Підтвердіть PIN</h1>
              <p className="text-[#8b949e] text-center mb-6">Погашення {formatAmount(payAmount)}</p>
              <Card variant="glass" padding="lg">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <PinPad onComplete={handlePayCredit} error={error || undefined} />
                )}
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-6">✅</motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Успішно!</h1>
              <p className="text-[#8b949e] mb-8">{successMsg}</p>
              <Button onClick={() => { setStep('list'); fetchCredits() }} fullWidth size="lg">OK</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <Button onClick={handleBack} variant="ghost">← Назад</Button>
          </motion.div>
        )}
      </div>
    </ATMLayout>
  )
}
