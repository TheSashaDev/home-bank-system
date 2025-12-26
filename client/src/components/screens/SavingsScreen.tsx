import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'
import { formatAmount } from '../../utils/transactionDisplay'
import type { Savings } from '../../types'

type Step = 'main' | 'deposit-amount' | 'deposit-pin' | 'withdraw-amount' | 'withdraw-pin' | 'success'

export function SavingsScreen() {
  const { setScreen, balance, fetchBalance } = useAppStore()
  const [step, setStep] = useState<Step>('main')
  const [savings, setSavings] = useState<Savings | null>(null)
  const [amount, setAmount] = useState('')
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

  const amountNum = parseInt(amount) * 100 || 0

  const handleDeposit = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.depositToSavings(amountNum, pin)
    if (res.success) {
      setSuccessMsg(`${formatAmount(amountNum)} додано на депозит`)
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
    const res = await api.withdrawFromSavings(amountNum, pin)
    if (res.success) {
      setSuccessMsg(`${formatAmount(amountNum)} знято з депозиту`)
      setStep('success')
      fetchSavings()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const yearlyEarnings = savings ? Math.round(savings.amount * savings.interestRate) : 0

  if (step === 'success') {
    return (
      <ATMLayout title="ДЕПОЗИТ">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Успішно!</h1>
          <p className="text-[#8b949e] text-sm mb-4">{successMsg}</p>
          <Button onClick={() => { setStep('main'); setAmount(''); fetchSavings() }} size="sm">OK</Button>
        </div>
      </ATMLayout>
    )
  }


  const handleBack = () => {
    setError(null)
    if (step === 'main') setScreen('main')
    else if (step === 'deposit-pin') setStep('deposit-amount')
    else if (step === 'withdraw-pin') setStep('withdraw-amount')
    else setStep('main')
  }

  return (
    <ATMLayout title="ДЕПОЗИТ">
      <div className="flex gap-4 w-full max-w-4xl h-full items-center">
        {/* Left: Savings info */}
        <div className="w-48 flex flex-col items-center">
          <p className="text-[#8b949e] text-xs mb-1">На депозиті</p>
          <p className="text-2xl font-bold text-[#3fb950] mb-1">{formatAmount(savings?.amount || 0)}</p>
          <p className="text-[#8b949e] text-xs">
            {savings?.interestRate ? `${(savings.interestRate * 100).toFixed(0)}% річних` : '8% річних'}
          </p>
          {yearlyEarnings > 0 && (
            <p className="text-xs text-[#8b949e] mt-1">~{formatAmount(yearlyEarnings)}/рік</p>
          )}
          {step === 'main' && (
            <div className="flex gap-2 mt-4">
              <Button onClick={() => { setAmount(''); setError(null); setStep('deposit-amount') }} size="sm">
                Поповнити
              </Button>
              <Button 
                onClick={() => { setAmount(''); setError(null); setStep('withdraw-amount') }} 
                variant="secondary" 
                size="sm"
                disabled={!savings || savings.amount <= 0}
              >
                Зняти
              </Button>
            </div>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 'main' && (
            <p className="text-[#8b949e] text-sm">Оберіть операцію</p>
          )}

          {(step === 'deposit-amount' || step === 'withdraw-amount') && (
            <div className="text-center">
              <p className="text-white text-sm mb-1">
                {step === 'deposit-amount' ? 'Поповнення' : 'Зняття'}
              </p>
              <p className="text-[#8b949e] text-xs mb-2">
                {step === 'deposit-amount' 
                  ? `Доступно: ${formatAmount(balance || 0)}`
                  : `На депозиті: ${formatAmount(savings?.amount || 0)}`
                }
              </p>
              <div className="text-3xl font-bold text-white mb-3">{amount || '0'} ₴</div>
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','00','0','⌫'].map(k => (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === '⌫') setAmount(a => a.slice(0,-1))
                      else if (amount.length < 6) setAmount(a => a + k)
                    }}
                    className="w-12 h-10 rounded-lg bg-[#21262d] text-white text-lg"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'deposit-pin' && (
            <div className="text-center">
              <p className="text-white text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-xs mb-3">Поповнення на {amount} ₴</p>
              {loading ? (
                <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <PinPad onComplete={handleDeposit} error={error || undefined} />
              )}
            </div>
          )}

          {step === 'withdraw-pin' && (
            <div className="text-center">
              <p className="text-white text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-xs mb-3">Зняття {amount} ₴</p>
              {loading ? (
                <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <PinPad onComplete={handleWithdraw} error={error || undefined} />
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="w-28 flex flex-col justify-between">
          <div />
          <div className="flex flex-col gap-2">
            {step === 'deposit-amount' && amountNum > 0 && amountNum <= (balance || 0) && (
              <Button onClick={() => setStep('deposit-pin')} size="sm">Далі</Button>
            )}
            {step === 'withdraw-amount' && amountNum > 0 && amountNum <= (savings?.amount || 0) && (
              <Button onClick={() => setStep('withdraw-pin')} size="sm">Далі</Button>
            )}
            <Button onClick={handleBack} variant="ghost" size="sm">← Назад</Button>
          </div>
        </div>
      </div>
    </ATMLayout>
  )
}
