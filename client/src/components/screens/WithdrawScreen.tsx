import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'
import { formatAmount } from '../../utils/transactionDisplay'

type Step = 'list' | 'create-amount' | 'create-card' | 'create-pin' | 'success'

type WithdrawalRequest = {
  id: string
  amount: number
  cardNumber: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment: string | null
  createdAt: string
}

export function WithdrawScreen() {
  const { setScreen, balance, fetchBalance } = useAppStore()
  const [step, setStep] = useState<Step>('list')
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [amount, setAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRequests = async () => {
    const res = await api.getMyWithdrawals()
    if (res.success && res.data) setRequests(res.data)
  }

  useEffect(() => {
    fetchRequests()
    fetchBalance()
  }, [])

  const amountNum = parseInt(amount) * 100 || 0

  const handleCreate = async (pin: string) => {
    setLoading(true)
    setError(null)
    const res = await api.createWithdrawal(amountNum, cardNumber, pin)
    if (res.success) {
      setStep('success')
      fetchRequests()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="text-yellow-400">⏳ На розгляді</span>
      case 'approved': return <span className="text-green-400">✅ Схвалено</span>
      case 'rejected': return <span className="text-red-400">❌ Відхилено</span>
      default: return status
    }
  }

  if (step === 'success') {
    return (
      <ATMLayout title="ВИВІД">
        <div className="text-center">
          <div className="text-5xl mb-3">📤</div>
          <h1 className="text-xl font-bold text-white mb-2">Запит створено!</h1>
          <p className="text-[#8b949e] text-sm mb-4">Очікуйте на розгляд адміністратором</p>
          <Button onClick={() => { setStep('list'); setAmount(''); setCardNumber(''); fetchRequests() }} size="sm">OK</Button>
        </div>
      </ATMLayout>
    )
  }


  return (
    <ATMLayout title="ВИВІД">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Left: History */}
        <div className="w-56 flex flex-col">
          <p className="text-[#8b949e] text-xs mb-2">Історія запитів</p>
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {requests.length === 0 ? (
              <p className="text-[#8b949e] text-xs">Немає запитів</p>
            ) : (
              requests.slice(0, 5).map(r => (
                <div key={r.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-bold">{formatAmount(r.amount)}</span>
                    {getStatusBadge(r.status)}
                  </div>
                  <p className="text-[#8b949e]">💳 {r.cardNumber}</p>
                  {r.adminComment && <p className="text-[#8b949e] mt-1">"{r.adminComment}"</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 'list' && (
            <div className="text-center">
              <p className="text-[#8b949e] text-sm mb-2">Баланс: {formatAmount(balance || 0)}</p>
              <Button onClick={() => { setAmount(''); setCardNumber(''); setError(null); setStep('create-amount') }}>
                Створити запит на вивід
              </Button>
            </div>
          )}

          {step === 'create-amount' && (
            <div className="text-center">
              <p className="text-white text-sm mb-1">Сума виводу</p>
              <p className="text-[#8b949e] text-xs mb-2">Можна виводити будь-які кошти</p>
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

          {step === 'create-card' && (
            <div className="text-center w-full max-w-xs">
              <p className="text-white text-sm mb-1">Номер картки отримувача</p>
              <p className="text-[#8b949e] text-xs mb-3">Куди переказати {amount} ₴</p>
              <input
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="0000 0000 0000 0000"
                className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-3 text-white text-center text-lg tracking-wider"
              />
              <p className="text-[#8b949e] text-xs mt-2">{cardNumber.length}/16 цифр</p>
            </div>
          )}

          {step === 'create-pin' && (
            <div className="text-center">
              <p className="text-white text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-xs mb-3">{amount} ₴ → {cardNumber}</p>
              {loading ? (
                <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <PinPad onComplete={handleCreate} error={error || undefined} />
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="w-28 flex flex-col justify-between">
          <div />
          <div className="flex flex-col gap-2">
            {step === 'create-amount' && amountNum > 0 && amountNum <= (balance || 0) && (
              <Button onClick={() => setStep('create-card')} size="sm">Далі</Button>
            )}
            {step === 'create-card' && cardNumber.length >= 13 && (
              <Button onClick={() => setStep('create-pin')} size="sm">Далі</Button>
            )}
            <Button onClick={() => step === 'list' ? setScreen('main') : setStep('list')} variant="ghost" size="sm">
              ← Назад
            </Button>
          </div>
        </div>
      </div>
    </ATMLayout>
  )
}
