import { motion } from 'framer-motion'
import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

export function ScanScreen() {
  const { scannedCard, clearScannedCard, setScreen, setPendingQrData } = useAppStore()

  // Если карта отсканирована - показываем данные и кнопку входа
  if (scannedCard) {
    return (
      <ATMLayout>
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">✓</div>
            <h1 className="text-3xl font-bold text-white mb-2">Картку розпізнано!</h1>
            
            <div className="bg-[#1a1f26] rounded-2xl p-6 mt-6 border border-[#30363d]">
              <p className="text-[#8b949e] text-sm">Власник картки</p>
              <p className="text-2xl font-bold text-white mt-1">{scannedCard.name}</p>
              
              <div className="flex justify-between mt-4 pt-4 border-t border-[#30363d]">
                <div>
                  <p className="text-[#8b949e] text-sm">Номер картки</p>
                  <p className="text-white font-mono">{scannedCard.cardNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#8b949e] text-sm">Баланс</p>
                  <p className="text-white font-bold">{(scannedCard.balance / 100).toFixed(2)} ₴</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPendingQrData(`HOMEBANK:${scannedCard.id}`)
                setScreen('pin')
              }}
              className="w-full mt-6 py-4 rounded-xl font-bold text-lg text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' }}
            >
              Увійти в акаунт
            </button>
            
            <button
              onClick={clearScannedCard}
              className="w-full mt-3 py-3 rounded-xl text-[#8b949e] hover:text-white transition-colors"
            >
              Скасувати
            </button>
          </motion.div>
        </div>
      </ATMLayout>
    )
  }

  // Инструкция по умолчанию
  return (
    <ATMLayout>
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Вітаємо в Home Bank!</h1>
          <p className="text-[#8b949e]">Дотримуйтесь інструкції для входу</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InstructionStep
            step={1}
            icon="💳"
            title="Візьміть картку"
            description="Підготуйте вашу банківську картку з QR-кодом"
            delay={0.1}
          />
          <InstructionStep
            step={2}
            icon="📱"
            title="Покажіть QR-код"
            description="Піднесіть QR-код картки до сканера зліва"
            delay={0.2}
          />
          <InstructionStep
            step={3}
            icon="🔐"
            title="Введіть PIN"
            description="Після сканування введіть ваш 4-значний PIN-код"
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#1a1f26] border border-[#30363d]">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[#8b949e]">Очікування сканування картки...</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex justify-center"
        >
          <div className="flex items-center gap-2 text-[#484f58] text-sm">
            <span>←</span>
            <span>Сканер знаходиться зліва від екрану</span>
          </div>
        </motion.div>
      </div>
    </ATMLayout>
  )
}

function InstructionStep({ step, icon, title, description, delay }: {
  step: number
  icon: string
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#1a1f26] rounded-2xl p-6 border border-[#30363d] text-center"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#30363d] text-white text-sm font-bold mb-3">
        {step}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-[#8b949e] text-sm">{description}</p>
    </motion.div>
  )
}
