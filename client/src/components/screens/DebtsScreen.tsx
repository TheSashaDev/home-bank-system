import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { AmountInput } from '../ui/AmountInput'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'
import { formatAmount } from '../../utils/transactionDisplay'
import type { Debt } from '../../types'

type Tab = 'my' | 'tome' | 'requests'
type Step = 'list' | 'create' | 'pay' | 'respond' | 'respond-pin' | 'success'

export function DebtsScreen() {
  const { setScreen, users, fetchUsers, fetchBalance } = useAppStore()
  const [tab, setTab] = useState<Tab>('my')
  const [step, setStep] = useState<Step>('list')
  const [myDebts, setMyDebts] = useState<Debt[]>([])
  const [debtsToMe, setDebtsToMe] = useState<Debt[]>([])
  const [requests, setRequests] = useState<Debt[]>([])
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [interestRate, setInterestRate] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchAll = async () => {
    const [my, tome, req] = await Promise.all([
      api.getMyDebts(),
      api.getDebtsToMe(),
      api.getDebtRequests()
    ])
    if (my.success && my.data) setMyDebts(my.data)
    if (tome.success && tome.data) setDebtsToMe(tome.data)
    if (req.success && req.data) setRequests(req.data)
  }

  useEffect(() => {
    fetchAll()
    fetchUsers()
  }, [])

  const handleCreateDebt = async () => {
    if (!selectedUser || amount <= 0) return
    setLoading(true)
    const res = await api.createDebt(selectedUser.id, amount, description || undefined)
    if (res.success) {
      setSuccessMsg('Запит на позику відправлено')
      setStep('success')
      fetchAll()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const handleRespond = async (accept: boolean, pin: string) => {
    if (!selectedDebt) return
    setLoading(true)
    const res = await api.respondToDebt(selectedDebt.id, accept, pin, accept ? interestRate : undefined)
    if (res.success) {
      setSuccessMsg(accept ? 'Позику надано' : 'Запит відхилено')
      setStep('success')
      fetchAll()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const handlePayDebt = async (pin: string) => {
    if (!selectedDebt) return
    setLoading(true)
    const res = await api.payDebt(selectedDebt.id, amount, pin)
    if (res.success) {
      setSuccessMsg(`Сплачено ${formatAmount(amount)}`)
      setStep('success')
      fetchAll()
      fetchBalance()
    } else {
      setError(res.error || 'Помилка')
    }
    setLoading(false)
  }

  const activeMyDebts = myDebts.filter(d => d.status === 'accepted')
  const activeDebtsToMe = debtsToMe.filter(d => d.status === 'accepted')
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Невідомий'

  if (step === 'success') {
    return (
      <ATMLayout title="БОРГИ">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Успішно!</h1>
          <p className="text-[#8b949e] text-sm mb-4">{successMsg}</p>
          <Button onClick={() => { setStep('list'); fetchAll() }} size="sm">OK</Button>
        </div>
      </ATMLayout>
    )
  }


  return (
    <ATMLayout title="БОРГИ">
      <div className="flex gap-4 w-full max-w-4xl h-full">
        {/* Left: Tabs and list */}
        <div className="w-56 flex flex-col">
          <div className="flex gap-1 mb-2">
            <button onClick={() => setTab('my')} className={`px-2 py-1 rounded text-xs ${tab === 'my' ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-[#8b949e]'}`}>
              Борги {activeMyDebts.length > 0 && `(${activeMyDebts.length})`}
            </button>
            <button onClick={() => setTab('tome')} className={`px-2 py-1 rounded text-xs ${tab === 'tome' ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-[#8b949e]'}`}>
              Мені {activeDebtsToMe.length > 0 && `(${activeDebtsToMe.length})`}
            </button>
            <button onClick={() => setTab('requests')} className={`px-2 py-1 rounded text-xs ${tab === 'requests' ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-[#8b949e]'}`}>
              Запити {requests.length > 0 && `(${requests.length})`}
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {tab === 'my' && (
              activeMyDebts.length === 0 ? (
                <p className="text-[#8b949e] text-xs">Немає боргів</p>
              ) : (
                activeMyDebts.slice(0, 3).map(d => (
                  <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Кому</span>
                      <span className="text-white">{getUserName(d.toUserId)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8b949e]">Сума</span>
                      <span className="text-[#f85149] font-bold">{formatAmount(d.remainingAmount)}</span>
                    </div>
                    <Button onClick={() => { setSelectedDebt(d); setAmount(d.remainingAmount); setStep('pay') }} fullWidth size="sm">
                      Повернути
                    </Button>
                  </div>
                ))
              )
            )}

            {tab === 'tome' && (
              activeDebtsToMe.length === 0 ? (
                <p className="text-[#8b949e] text-xs">Ніхто не винен</p>
              ) : (
                activeDebtsToMe.slice(0, 3).map(d => (
                  <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Хто</span>
                      <span className="text-white">{getUserName(d.fromUserId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Сума</span>
                      <span className="text-[#3fb950] font-bold">{formatAmount(d.remainingAmount)}</span>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === 'requests' && (
              requests.length === 0 ? (
                <p className="text-[#8b949e] text-xs">Немає запитів</p>
              ) : (
                requests.slice(0, 2).map(d => (
                  <div key={d.id} className="bg-[#21262d] rounded-lg p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Від</span>
                      <span className="text-white">{getUserName(d.fromUserId)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8b949e]">Сума</span>
                      <span className="text-[#ff6b9d] font-bold">{formatAmount(d.amount)}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button onClick={() => { setSelectedDebt(d); setInterestRate(0); setStep('respond') }} size="sm" fullWidth>Дати</Button>
                      <Button onClick={() => { setSelectedDebt(d); handleRespond(false, '') }} variant="secondary" size="sm" fullWidth>Ні</Button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {tab === 'my' && (
            <Button onClick={() => { setSelectedUser(null); setAmount(0); setDescription(''); setStep('create') }} variant="primary" fullWidth size="sm" className="mt-2">
              Попросити в борг
            </Button>
          )}
        </div>


        {/* Center: Current step */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {step === 'list' && (
            <div className="text-center text-[#8b949e]">
              <p className="text-sm">Оберіть борг або запит</p>
            </div>
          )}

          {step === 'create' && (
            <div className="w-full max-w-xs">
              {!selectedUser ? (
                <>
                  <p className="text-white text-center text-sm mb-2">У кого позичити?</p>
                  <div className="flex flex-col gap-1">
                    {users.slice(0, 5).map(u => (
                      <button key={u.id} onClick={() => setSelectedUser(u)} className="px-3 py-2 rounded-lg bg-[#21262d] text-white text-sm text-left">
                        {u.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white text-center text-sm mb-2">Позичити у {selectedUser.name}</p>
                  <AmountInput value={amount} onChange={setAmount} label="Сума" />
                  <input
                    type="text"
                    placeholder="Причина"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-white text-sm mt-2"
                  />
                  {error && <p className="text-[#f85149] text-center text-xs mt-2">{error}</p>}
                </>
              )}
            </div>
          )}

          {step === 'respond' && selectedDebt && (
            <div className="w-full max-w-xs text-center">
              <p className="text-white text-sm mb-2">Позичити {formatAmount(selectedDebt.amount)}</p>
              <p className="text-[#8b949e] text-xs mb-3">Встановіть відсоток (необов'язково)</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {[0, 5, 10, 15, 20].map(r => (
                  <button
                    key={r}
                    onClick={() => setInterestRate(r)}
                    className={`px-3 py-2 rounded-lg text-sm ${interestRate === r ? 'bg-[#ff6b9d] text-white' : 'bg-[#21262d] text-white'}`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
              {interestRate > 0 && (
                <p className="text-[#8b949e] text-xs mb-3">
                  Повернути: {formatAmount(Math.round(selectedDebt.amount * (1 + interestRate / 100)))}
                </p>
              )}
              <Button onClick={() => setStep('respond-pin')} fullWidth>Далі</Button>
            </div>
          )}

          {step === 'respond-pin' && selectedDebt && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-1">Підтвердіть PIN</p>
              <p className="text-[#8b949e] text-center text-xs mb-3">
                Позичити {formatAmount(selectedDebt.amount)}{interestRate > 0 ? ` (+${interestRate}%)` : ''}
              </p>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <PinPad onComplete={(pin) => handleRespond(true, pin)} error={error || undefined} />
              )}
            </div>
          )}

          {step === 'pay' && selectedDebt && (
            <div className="w-full max-w-xs">
              <p className="text-white text-center text-sm mb-2">Повернення боргу</p>
              <AmountInput value={amount} onChange={setAmount} maxAmount={selectedDebt.remainingAmount} label={`Залишок: ${formatAmount(selectedDebt.remainingAmount)}`} />
              {amount > 0 && (
                <>
                  <p className="text-[#8b949e] text-center text-xs my-2">Введіть PIN</p>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <PinPad onComplete={handlePayDebt} error={error || undefined} />
                  )}
                </>
              )}
            </div>
          )}
        </div>


        {/* Right: Actions */}
        <div className="w-28 flex flex-col justify-between">
          <div />
          <div className="flex flex-col gap-2">
            {step === 'create' && selectedUser && amount > 0 && (
              <Button onClick={handleCreateDebt} size="sm" disabled={loading}>
                {loading ? '...' : 'Відправити'}
              </Button>
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
