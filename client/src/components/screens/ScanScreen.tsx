import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

export function ScanScreen() {
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { setPendingQrData, setScreen } = useAppStore()

  const startScanner = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) {
        setError('Камеру не знайдено')
        setIsScanning(false)
        return
      }

      const backCam = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear')
      )
      const cameraId = backCam?.id || cameras[0].id

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(100)
          scanner.stop().catch(() => {})
          setPendingQrData(decodedText)
          setScreen('pin')
        },
        () => {}
      )
    } catch (err) {
      console.error('Scanner error:', err)
      setError('Не вдалося запустити камеру')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  return (
    <ATMLayout>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Вітаємо!</h1>
          <p className="text-[#8b949e]">Піднесіть картку до камери</p>
        </motion.div>

        <Card variant="glass" padding="lg">
          <div className="flex flex-col items-center gap-6">
            <div
              id="qr-reader"
              className="w-full aspect-square rounded-xl overflow-hidden bg-[#161b22] border border-[#30363d]"
              style={{ maxWidth: 280 }}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#f85149] text-center"
              >
                {error}
              </motion.p>
            )}

            {!isScanning ? (
              <Button onClick={startScanner} fullWidth size="lg">
                Почати сканування
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="secondary" fullWidth>
                Зупинити
              </Button>
            )}
          </div>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-[#484f58] text-sm text-center"
        >
          Якщо QR-код не розпізнається, спробуйте ще раз
        </motion.p>
      </div>
    </ATMLayout>
  )
}
