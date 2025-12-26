import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

const menuItems = [
  { id: 'balance', label: 'Баланс', icon: '💰', screen: 'balance' as const },
  { id: 'transfer', label: 'Переказ', icon: '💸', screen: 'transfer' as const },
  { id: 'credits', label: 'Кредити', icon: '🏦', screen: 'credits' as const },
  { id: 'savings', label: 'Депозит', icon: '🐷', screen: 'savings' as const },
  { id: 'debts', label: 'Борги', icon: '🤝', screen: 'debts' as const },
  { id: 'history', label: 'Історія', icon: '📋', screen: 'history' as const },
]

export function MainMenu() {
  const { user, setScreen, logout } = useAppStore()

  const handleLogout = () => {
    if (navigator.vibrate) navigator.vibrate(30)
    logout()
  }

  return (
    <ATMLayout title="ГОЛОВНЕ МЕНЮ">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Привіт, {user?.name || 'Користувач'}!
          </h1>
          <p className="text-[#8b949e]">Оберіть операцію</p>
        </motion.div>

        <Card variant="glass" padding="lg">
          <div className="flex flex-col gap-4">
            {menuItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Button
                  onClick={() => setScreen(item.screen)}
                  variant="secondary"
                  fullWidth
                  size="lg"
                  className="justify-start gap-4 text-left"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Button>
              </motion.div>
            ))}

            {user?.isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={() => setScreen('admin')}
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="justify-start gap-4 text-left"
                >
                  <span className="text-2xl">⚙️</span>
                  <span>Адміністрування</span>
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 pt-4 border-t border-[#30363d]"
            >
              <Button onClick={handleLogout} variant="ghost" fullWidth>
                Вийти
              </Button>
            </motion.div>
          </div>
        </Card>
      </div>
    </ATMLayout>
  )
}
