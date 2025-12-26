import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

const menuItems = [
  { id: 'balance', label: 'Баланс', icon: '💰', screen: 'balance' as const },
  { id: 'transfer', label: 'Переказ', icon: '💸', screen: 'transfer' as const },
  { id: 'credits', label: 'Кредити', icon: '🏦', screen: 'credits' as const },
  { id: 'savings', label: 'Депозит', icon: '🐷', screen: 'savings' as const },
  { id: 'debts', label: 'Борги', icon: '🤝', screen: 'debts' as const },
  { id: 'withdraw', label: 'Вивід', icon: '💳', screen: 'withdraw' as const },
  { id: 'history', label: 'Історія', icon: '📋', screen: 'history' as const },
]

export function MainMenu() {
  const { user, setScreen, logout } = useAppStore()

  return (
    <ATMLayout title="ГОЛОВНЕ МЕНЮ">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">
            Привіт, {user?.name || 'Користувач'}!
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.screen)}
              className="bg-[#21262d] hover:bg-[#30363d] rounded-xl p-4 flex items-center gap-3 text-left border border-[#30363d]"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-white font-medium">{item.label}</span>
            </button>
          ))}

          {user?.isAdmin && (
            <button
              onClick={() => setScreen('admin')}
              className="bg-gradient-to-r from-[#ff6b9d] to-[#c44569] rounded-xl p-4 flex items-center gap-3 text-left"
            >
              <span className="text-2xl">⚙️</span>
              <span className="text-white font-medium">Адмін</span>
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button onClick={logout} className="text-[#8b949e] text-sm hover:text-white">
            Вийти
          </button>
        </div>
      </div>
    </ATMLayout>
  )
}
