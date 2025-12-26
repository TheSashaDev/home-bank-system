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
import type { Debt } from '../../types'

type Tab = 'my' | 'tome' | 'requests'
type Step = 'list' | 'create' | 'pay' | 'respond' | 'success'

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
    const res = await api.respondToDebt(selectedDebt.id, accept, pin)
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

  return (
    <ATMLayout title="БОРГИ">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-2 mb-6">
                <Button onClick={() => setTab('my')} variant={tab === 'my' ? 'primary' : 'secondary'} size="sm">
                  Мої борги {activeMyDebts.length > 0 && `(${activeMyDebts.length})`}
                </Button>
                <Button onClick={() => setTab('tome')} variant={tab === 'tome' ? 'primary' : 'secondary'} size="sm">
                  Мені винні {activeDebtsToMe.length > 0 && `(${activeDebtsToMe.length})`}
                </Button>
                <Button onClick={() => setTab('requests')} variant={tab === 'requests' ? 'primary' : 'secondary'} size="sm">
                  Запити {requests.length > 0 && `(${requests.length})`}
                </Button>
              </div>

              <Card variant="glass" padding="lg">
                {tab === 'my' && (
                  <>
                    {activeMyDebts.length === 0 ? (
                      <p className="text-[#8b949e] text-center py-4">Немає боргів</p>
                    ) : (
                      <div className="flex flex-col gap-3 mb-4">
                        {activeMyDebts.map(d => (
                          <div key={d.id} className="bg-[#21262d] rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-[#8b949e]">Кому</span>
                              <span className="text-white">{getUserName(d.toUserId)}</span>
                            </div>
                            <div className="flex justify-between mb-3">
                              <span className="text-[#8b949e]">Залишок</span>
                              <span className="text-[#f85149] font-bold">{formatAmount(d.remainingAmount)}</span>
                            </div>
                            <Button onClick={() => { setSelectedDebt(d); setAmount(d.remainingAmount); setStep('pay') }} fullWidth size="sm">
                              Повернути
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button onClick={() => { setSelectedUser(null); setAmount(0); setDescription(''); setStep('create') }} variant="primary" fullWidth>
                      Попросити в борг
                    </Button>
                  </>
                )}

                {tab === 'tome' && (
                  activeDebtsToMe.length === 0 ? (
                    <p className="text-[#8b949e] text-center py-4">Ніхто не винен</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeDebtsToMe.map(d => (
                        <div key={d.id} className="bg-[#21262d] rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-[#8b949e]">Хто</span>
                            <span className="text-white">{getUserName(d.fromUserId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8b949e]">Сума</span>
                            <span className="text-[#3fb950] font-bold">{formatAmount(d.remainingAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tab === 'requests' && (
                  requests.length === 0 ? (
                    <p className="text-[#8b949e] text-center py-4">Немає запитів</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {requests.map(d => (
                        <div key={d.id} className="bg-[#21262d] rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-[#8b949e]">Від</span>
                            <span className="text-white">{getUserName(d.fromUserId)}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[#8b949e]">Сума</span>
                            <span className="text-[#ff6b9d] font-bold">{formatAmount(d.amount)}</span>
                          </div>
                          {d.description && <p className="text-[#8b949e] text-sm mb-3">{d.description}</p>}
                          <div className="flex gap-2">
                            <Button onClick={() => { setSelectedDebt(d); setStep('respond') }} variant="primary" fullWidth size="sm">
                              Позичити
                            </Button>
                            <Button onClick={() => { setSelectedDebt(d); handleRespond(false, '') }} variant="secondary" fullWidth size="sm">
                              Відхилити
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </Card>
            </motion.div>
          )}

          {step === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Попросити в борг</h1>
              <Card variant="glass" padding="lg">
                {!selectedUser ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[#8b949e] text-center mb-2">Оберіть у кого позичити</p>
                    {users.map(u => (
                      <Button key={u.id} onClick={() => setSelectedUser(u)} variant="secondary" fullWidth>
                        {u.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-[#8b949e] text-center mb-4">Позичити у {selectedUser.name}</p>
                    <AmountInput value={amount} onChange={setAmount} label="Сума" />
                    <input
                      type="text"
                      placeholder="Причина (необов'язково)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-4 py-3 text-white mt-4"
                    />
                    {error && <p className="text-[#f85149] text-center mt-4">{error}</p>}
                    <Button onClick={handleCreateDebt} fullWidth size="lg" className="mt-6" disabled={loading || amount <= 0}>
                      {loading ? 'Відправка...' : 'Відправити запит'}
                    </Button>
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {step === 'respond' && selectedDebt && (
            <motion.div key="respond" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Підтвердіть PIN</h1>
              <p className="text-[#8b949e] text-center mb-6">Позичити {formatAmount(selectedDebt.amount)}</p>
              <Card variant="glass" padding="lg">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <PinPad onComplete={(pin) => handleRespond(true, pin)} error={error || undefined} />
                )}
              </Card>
            </motion.div>
          )}

          {step === 'pay' && selectedDebt && (
            <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-6 text-center">Повернення боргу</h1>
              <Card variant="glass" padding="lg">
                <AmountInput value={amount} onChange={setAmount} maxAmount={selectedDebt.remainingAmount} label={`Залишок: ${formatAmount(selectedDebt.remainingAmount)}`} />
                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-[#8b949e] text-center my-4">Введіть PIN</p>
                    <PinPad onComplete={handlePayDebt} error={error || undefined} />
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
              <Button onClick={() => { setStep('list'); fetchAll() }} fullWidth size="lg">OK</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <Button onClick={() => step === 'list' ? setScreen('main') : setStep('list')} variant="ghost">← Назад</Button>
          </motion.div>
        )}
      </div>
    </ATMLayout>
  )
}
