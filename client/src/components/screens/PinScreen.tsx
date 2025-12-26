import { useState } from 'react'
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
      setError(res.error || 'Помилка')
    }

    setLoading(false)
  }

  const handleCancel = () => {
    setPendingQrData(null)
    setScreen('scan')
  }

  return (
    <ATMLayout title="АВТОРИЗАЦІЯ">
      <div className="w-full max-w-xs">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">Введіть PIN</h1>
          <p className="text-[#8b949e] text-sm">4-значний код</p>
        </div>

        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-3 border-[#ff6b9d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#8b949e] text-sm">Перевірка...</p>
            </div>
          ) : (
            <PinPad
              onComplete={handlePinComplete}
              onCancel={handleCancel}
              error={error || undefined}
            />
          )}
        </div>
      </div>
    </ATMLayout>
  )
}
