import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { AmountInput } from '../ui/AmountInput'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'
import { formatAmount } from '../../utils/transactionDisplay'

type Credit = {
  id: string
  amount: number
  remainingAmount: number
  weeks: number
  weeklyPayment: number
  status: string
}

type Step = 'list' | 'take' | 'weeks' | 'confirm' | 'pay-amount' | 'pay-pin' | 'success'

export function CreditsScreen() {
  const { setScreen } = useAppStore()
  const [step, setStep] = useState<Step>('list')
  const [credits, setCredits] = useState<Credit[]>([])
  const [amount, setAmount] = useState(0)
  const [weeks, setWeeks] = useState(4)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchCredits = async () => {
    const res = await api.getMyCredits()
    if (res.success && res.data) setCredits(res.data as any)
  }

  useEffect(() => { fetchCredits() }, [])

  // 8% за кожен тиждень
  const totalWithInterest = Math.round(amount * (1 + 0.08 * weeks))
  const weeklyPayment = Math.round(totalWithInterest / weeks)

  const handleTakeCredit = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.takeCredit(amount, weeks, pin)
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
      case 'weeks': setStep('take'); break
      case 'confirm': setStep('weeks'); break
      case 'pay-amount': setStep('list'); break
      case 'pay-pin': setStep('pay-amount'); break
      default: setStep('list')
    }
  }

  const activeCredits = credits.filter(c => c.status === 'active')

  if (step === 'success') {
    return (
      <ATMLayout title="КРЕДИТИ">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Успішно!</h1>
          <p className="text-[#8b949e] text-sm mb-4">{successMsg}</p>
          <Button onClick={() => { setStep('list'); fetchCredits() }} size="sm">OK</Button>
        </div>
      </ATMLayout>
    )
  }

  return (
    <ATMLayout title="КРЕДИТИ">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Left: Credits list */}
        <div className="w-56 flex flex-col">
          <p className="text-[#8b949e] text-xs mb-2">Активні кредити:</p>
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {activeCredits.length === 0 ? (
              <p className="text-[#8b949e] text-xs">Немає кредитів</p>
            ) : (
              activeCredits.slice(0, 3).map(c => (
                <div key={c.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Залишок</span>
                    <span className="text-white font-bold">{formatAmount(c.remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#8b949e]">Щотижня</span>
                    <span className="text-[#ff6b9d]">{formatAmount(c.weeklyPayment)}</span>
                  </div>
                  <Button
                    onClick={() => { setSelectedCredit(c); setPayAmount(c.weeklyPayment); setError(null); setStep('pay-amount') }}
                    fullWidth size="sm"
                  >
                    Погасити
                  </Button>
                </div>
              ))
            )}
          </div>
          <Button onClick={() => { setAmount(0); setStep('take') }} variant="primary" fullWidth size="sm" className="mt-2">
            Взяти кредит
          </Button>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 'list' && (
            <div className="text-center text-[#8b949e]">
              <p className="text-sm">Оберіть кредит для погашення</p>
              <p className="text-xs mt-1">або візьміть новий</p>
            </div>
          )}

          {step === 'take' && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-2">Сума кредиту</p>
              <AmountInput value={amount} onChange={setAmount} maxAmount={10000000} label="Макс: 100,000 грн" />
              {amount > 0 && <p className="text-[#ff6b9d] text-center text-xs mt-2">⚠️ 8% за кожен тиждень!</p>}
            </div>
          )}

          {step === 'weeks' && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-3">Термін кредиту</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[1, 2, 4, 8, 10, 12].map(w => (
                  <button
                    key={w}
                    onClick={() => setWeeks(w)}
                    className={`py-2 rounded-lg text-sm ${weeks === w ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-white'}`}
                  >
                    {w}т
                  </button>
                ))}
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-[#8b949e]">Сума</span>
                  <span className="text-white">{formatAmount(amount)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#8b949e]">До сплати (+{weeks * 8}%)</span>
                  <span className="text-[#f85149]">{formatAmount(totalWithInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Щотижня</span>
                  <span className="text-[#ff6b9d] font-bold">{formatAmount(weeklyPayment)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-center text-xs mb-3">{formatAmount(amount)} на {weeks} тижн.</p>
              {loading ? (
                <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <PinPad onComplete={handleTakeCredit} error={error || undefined} />
              )}
            </div>
          )}

          {step === 'pay-amount' && selectedCredit && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-2">Сума погашення</p>
              <AmountInput 
                value={payAmount} 
                onChange={setPayAmount} 
                maxAmount={selectedCredit.remainingAmount} 
                label={`Залишок: ${formatAmount(selectedCredit.remainingAmount)}`} 
              />
            </div>
          )}

          {step === 'pay-pin' && selectedCredit && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-center text-xs mb-3">Погашення {formatAmount(payAmount)}</p>
              {loading ? (
                <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <PinPad onComplete={handlePayCredit} error={error || undefined} />
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="w-28 flex flex-col justify-between">
          <div />
          <div className="flex flex-col gap-2">
            {step === 'take' && amount > 0 && (
              <Button onClick={() => setStep('weeks')} size="sm">Далі</Button>
            )}
            {step === 'weeks' && (
              <Button onClick={() => setStep('confirm')} size="sm">Оформити</Button>
            )}
            {step === 'pay-amount' && payAmount > 0 && (
              <Button onClick={() => setStep('pay-pin')} size="sm">Далі</Button>
            )}
            <Button onClick={handleBack} variant="ghost" size="sm">← Назад</Button>
          </div>
        </div>
      </div>
    </ATMLayout>
  )
}
