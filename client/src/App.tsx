import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/appStore'
import { useScannerSocket } from './hooks/useScannerSocket'
import { ScanNotification } from './components/ui/ScanNotification'
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
} from './components/screens'
import {
  AdminPanel,
  CreateCardScreen,
  DepositScreen,
  UsersScreen,
} from './components/screens/admin'

const screenVariants = {
  initial: { opacity: 0, x: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 },
}

const screenTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

function App() {
  const { currentScreen } = useAppStore()
  
  useScannerSocket()

  const renderScreen = () => {
    switch (currentScreen) {
      case 'scan':
        return <ScanScreen />
      case 'pin':
        return <PinScreen />
      case 'main':
        return <MainMenu />
      case 'balance':
        return <BalanceScreen />
      case 'transfer':
        return <TransferScreen />
      case 'history':
        return <HistoryScreen />
      case 'credits':
        return <CreditsScreen />
      case 'savings':
        return <SavingsScreen />
      case 'debts':
        return <DebtsScreen />
      case 'admin':
        return <AdminPanel />
      case 'admin-deposit':
        return <DepositScreen />
      case 'admin-create':
        return <CreateCardScreen />
      case 'admin-users':
        return <UsersScreen />
      default:
        return <ScanScreen />
    }
  }

  return (
    <>
      <ScanNotification />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={screenTransition}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App
