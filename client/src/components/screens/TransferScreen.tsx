import { useEffect, useState } from 'react'
import { ATMLayout } from '../ui/ATMLayout'
import { PinPad } from '../ui/PinPad'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'

type Step = 'select' | 'amount' | 'confirm' | 'success'

export function TransferScreen() {
  const { user, users, balance, fetchUsers, fetchBalance, setScreen } = useAppStore()
  const [step, setStep] = useState<Step>('select')
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchBalance()
  }, [])

  const filteredUsers = users.filter(u => u.id !== user?.id)
  const amountNum = parseInt(amount) * 100 || 0

  const handlePinComplete = async (pin: string) => {
    if (!selectedUser) return
    setLoading(true)
    const res = await api.transfer(selectedUser.id, amountNum, pin)
    if (res.success) {
      setStep('success')
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <ATMLayout title="УСПІХ">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Переказ виконано!</h1>
          <p className="text-[#8b949e] text-sm mb-4">{amount} ₴ → {selectedUser?.name}</p>
          <button onClick={() => setScreen('main')} className="px-6 py-2 rounded-lg bg-[#ff6b9d] text-white font-bold">
            До меню
          </button>
        </div>
      </ATMLayout>
    )
  }

  return (
    <ATMLayout title="ПЕРЕКАЗ">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Left: User list */}
        <div className="w-48 flex flex-col">
          <p className="text-[#8b949e] text-xs mb-2">Отримувач:</p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {filteredUsers.slice(0, 6).map(u => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u); setStep('amount') }}
                className={`text-left px-3 py-2 rounded-lg text-sm ${
                  selectedUser?.id === u.id ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-white'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Amount */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-3xl font-bold text-white mb-1">{amount || '0'} ₴</div>
          <p className="text-[#8b949e] text-xs mb-3">Макс: {((balance || 0) / 100).toFixed(0)} ₴</p>
          
          {step === 'confirm' ? (
            loading ? (
              <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <PinPad onComplete={handlePinComplete} error={error || undefined} />
            )
          ) : (
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
          )}
          
          {error && step !== 'confirm' && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* Right: Actions */}
        <div className="w-32 flex flex-col justify-between">
          <div>
            {selectedUser && (
              <div className="text-xs text-[#8b949e] mb-2">
                Кому: <span className="text-white">{selectedUser.name}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {step === 'amount' && selectedUser && amountNum > 0 && (
              <button
                onClick={() => {
                  if (amountNum > (balance || 0)) {
                    setError('Недостатньо коштів')
                  } else {
                    setError(null)
                    setStep('confirm')
                  }
                }}
                className="py-2 rounded-lg bg-[#ff6b9d] text-white text-sm font-bold"
              >
                Далі
              </button>
            )}
            <button onClick={() => setScreen('main')} className="py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-sm">
              Назад
            </button>
          </div>
        </div>
      </div>
    </ATMLayout>
  )
}
