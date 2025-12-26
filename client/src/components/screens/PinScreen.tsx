import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { PinPad } from '../ui/PinPad'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { api } from '../../api/client'

export function PinScreen() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { pendingQrData, setUser, setScreen, setPendingQrData } = useAppStore()

  const handlePinComplete = async (pin: string) => {
    if (!pendingQrData) {
      setScreen('scan')
      return
    }

    setLoading(true)
    setError(null)

    const res = await api.login(pendingQrData, pin)

    if (res.success && res.data) {
      api.setToken(res.data.token)
      setUser(res.data.user)
      setPendingQrData(null)
      setScreen('main')
    } else {
      setError(res.error || 'Помилка авторизації')
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    }

    setLoading(false)
  }

  const handleCancel = () => {
    setPendingQrData(null)
    setScreen('scan')
  }

  return (
    <ATMLayout title="АВТОРИЗАЦІЯ">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Введіть PIN</h1>
          <p className="text-[#8b949e]">4-значний код вашої картки</p>
        </motion.div>

        <Card variant="glass" padding="lg">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div
                className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-[#8b949e]">Перевірка...</p>
            </div>
          ) : (
            <PinPad
              onComplete={handlePinComplete}
              onCancel={handleCancel}
              error={error || undefined}
            />
          )}
        </Card>
      </div>
    </ATMLayout>
  )
}
