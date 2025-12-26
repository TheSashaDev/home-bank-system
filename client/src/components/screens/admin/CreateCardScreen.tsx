import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'
import { api } from '../../../api/client'

export function CreateCardScreen() {
  const { setScreen } = useAppStore()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<{ name: string; qrCode: string; cardNumber: string } | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Введіть ім'я")
      return
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN має бути 4 цифри')
      return
    }

    setLoading(true)
    setError(null)

    const res = await api.createUser(name.trim(), pin, isAdmin)
    
    if (res.success && res.data) {
      setCreatedUser({
        name: res.data.user.name,
        qrCode: res.data.qrCode,
        cardNumber: res.data.user.cardNumber,
      })
      setName('')
      setPin('')
      setIsAdmin(false)
    } else {
      setError(res.error || 'Помилка створення')
    }
    setLoading(false)
  }

  if (createdUser) {
    return (
      <ATMLayout title="КАРТКУ СТВОРЕНО">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-white mb-2">✅ Готово!</h1>
          </motion.div>

          <Card variant="elevated" padding="lg" className="print:shadow-none">
            <div className="bg-gradient-to-br from-[#21262d] to-[#161b22] rounded-xl p-6 mb-6 border border-[#30363d] print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏦</span>
                <span className="text-white font-bold text-lg print:text-black">HOME BANK</span>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={createdUser.qrCode} size={120} level="M" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg print:text-black">{createdUser.name}</p>
                  <p className="text-[#484f58] font-mono print:text-gray-600">**** {createdUser.cardNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <Button onClick={() => window.print()} variant="primary" fullWidth>
                🖨️ Друкувати
              </Button>
              <Button onClick={() => setCreatedUser(null)} variant="secondary" fullWidth>
                Створити ще
              </Button>
            </div>
          </Card>

          <motion.div className="mt-6 text-center print:hidden">
            <Button onClick={() => setScreen('admin')} variant="ghost">
              ← Назад
            </Button>
          </motion.div>
        </div>
      </ATMLayout>
    )
  }

  return (
    <ATMLayout title="НОВА КАРТКА">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">🆕 Створити картку</h1>
        </motion.div>

        <Card variant="glass" padding="lg">
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[#8b949e] text-sm mb-2">Ім'я</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Тарас"
                className="w-full bg-[#21262d] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#ff6b9d]"
              />
            </div>

            <div>
              <label className="block text-[#8b949e] text-sm mb-2">PIN (4 цифри)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full bg-[#21262d] border border-[#30363d] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-[#484f58] focus:outline-none focus:border-[#ff6b9d]"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-5 h-5 rounded bg-[#21262d] border-[#30363d] text-[#ff6b9d]"
              />
              <span className="text-[#8b949e]">Адміністратор</span>
            </label>

            {error && <p className="text-[#f85149] text-center">{error}</p>}

            <Button onClick={handleCreate} variant="primary" fullWidth size="lg" disabled={loading}>
              {loading ? 'Створення...' : 'Створити картку'}
            </Button>
          </div>
        </Card>

        <motion.div className="mt-8 text-center">
          <Button onClick={() => setScreen('admin')} variant="ghost">
            ← Назад
          </Button>
        </motion.div>
      </div>
    </ATMLayout>
  )
}
