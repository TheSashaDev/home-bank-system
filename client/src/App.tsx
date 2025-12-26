import { useAppStore } from './store/appStore'
import { useScannerSocket } from './hooks/useScannerSocket'
import {
  ScanScreen,
  PinScreen,
  MainMenu,
  BalanceScreen,
  TransferScreen,
  HistoryScreen,
  CreditsScreen,
  SavingsScreen,
  DebtsScreen,
  WithdrawScreen,
} from './components/screens'
import {
  AdminPanel,
  CreateCardScreen,
  DepositScreen,
  UsersScreen,
  AdminTransactionsScreen,
  CreditsAdminScreen,
  DebtsAdminScreen,
  WithdrawalsAdminScreen,
} from './components/screens/admin'

function App() {
  const { currentScreen } = useAppStore()
  
  useScannerSocket()

  const renderScreen = () => {
    switch (currentScreen) {
      case 'scan': return <ScanScreen />
      case 'pin': return <PinScreen />
      case 'main': return <MainMenu />
      case 'balance': return <BalanceScreen />
      case 'transfer': return <TransferScreen />
      case 'history': return <HistoryScreen />
      case 'credits': return <CreditsScreen />
      case 'savings': return <SavingsScreen />
      case 'debts': return <DebtsScreen />
      case 'withdraw': return <WithdrawScreen />
      case 'admin': return <AdminPanel />
      case 'admin-deposit': return <DepositScreen />
      case 'admin-create': return <CreateCardScreen />
      case 'admin-users': return <UsersScreen />
      case 'admin-transactions': return <AdminTransactionsScreen />
      case 'admin-credits': return <CreditsAdminScreen />
      case 'admin-debts': return <DebtsAdminScreen />
      case 'admin-withdrawals': return <WithdrawalsAdminScreen />
      default: return <ScanScreen />
    }
  }

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  )
}

export default App
