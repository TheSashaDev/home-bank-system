import { motion } from 'framer-motion'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { ATMLayout } from '../../ui/ATMLayout'
import { useAppStore } from '../../../store/appStore'

const menuItems = [
  { id: 'deposit', label: 'Поповнити рахунок', icon: '💵', screen: 'admin-deposit' as const },
  { id: 'create', label: 'Створити картку', icon: '🆕', screen: 'admin-create' as const },
  { id: 'users', label: 'Всі користувачі', icon: '👥', screen: 'admin-users' as const },
]

export function AdminPanel() {
  const { setScreen } = useAppStore()

  const downloadATMTemplate = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/atm-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'atm-template.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Помилка завантаження')
    }
  }

  return (
    <ATMLayout title="АДМІНІСТРУВАННЯ">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">⚙️ Адміністрування</h1>
          <p className="text-[#8b949e]">Панель керування</p>
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

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4 border-t border-[#30363d]"
            >
              <Button
                onClick={downloadATMTemplate}
                variant="primary"
                fullWidth
                size="lg"
                className="justify-start gap-4 text-left"
              >
                <span className="text-2xl">🏧</span>
                <span>Шаблон банкомата (PDF)</span>
              </Button>
            </motion.div>
          </div>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
