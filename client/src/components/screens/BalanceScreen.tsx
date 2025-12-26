import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'
import { formatAmount } from '../../utils/transactionDisplay'

function AnimatedBalance({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (v) => formatAmount(Math.round(v)))
  const [displayValue, setDisplayValue] = useState(formatAmount(0))

  useEffect(() => {
    spring.set(value)
    const unsub = display.on('change', (v) => setDisplayValue(v))
    return () => unsub()
  }, [value, spring, display])

  return (
    <motion.span
      className="text-5xl font-bold bg-gradient-to-r from-[#ff6b9d] to-[#c44569] bg-clip-text text-transparent"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {displayValue}
    </motion.span>
  )
}

export function BalanceScreen() {
  const { balance, loading, error, fetchBalance, setScreen } = useAppStore()

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return (
    <ATMLayout title="БАЛАНС">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Ваш баланс</h1>
        </motion.div>

        <Card variant="elevated" padding="lg">
          <div className="flex flex-col items-center gap-6">
            {loading ? (
              <motion.div
                className="w-12 h-12 border-4 border-[#ff6b9d] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : error ? (
              <p className="text-[#f85149]">{error}</p>
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <AnimatedBalance value={balance ?? 0} />
                <motion.p
                  className="text-[#8b949e] mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  доступно
                </motion.p>
              </motion.div>
            )}
          </div>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Button onClick={() => setScreen('main')} variant="ghost">
            ← Назад до меню
          </Button>
        </motion.div>
      </div>
    </ATMLayout>
  )
}
