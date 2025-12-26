import { ATMLayout } from '../ui/ATMLayout'
import { useAppStore } from '../../store/appStore'

export function ScanScreen() {
  const { scannedCard, clearScannedCard, setScreen, setPendingQrData } = useAppStore()

  if (scannedCard) {
    return (
      <ATMLayout>
        <div className="w-full max-w-lg">
          <div className="text-center">
            <div className="text-4xl mb-3">✓</div>
            <h1 className="text-xl font-bold text-white mb-2">Картку розпізнано!</h1>
            
            <div className="bg-[#1a1f26] rounded-xl p-4 mt-4 border border-[#30363d]">
              <p className="text-[#8b949e] text-xs">Власник картки</p>
              <p className="text-lg font-bold text-white">{scannedCard.name}</p>
              
              <div className="flex justify-between mt-3 pt-3 border-t border-[#30363d] text-sm">
                <div>
                  <p className="text-[#8b949e] text-xs">Картка</p>
                  <p className="text-white font-mono">{scannedCard.cardNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#8b949e] text-xs">Баланс</p>
                  <p className="text-white font-bold">{(scannedCard.balance / 100).toFixed(2)} ₴</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPendingQrData(scannedCard.qrData)
                setScreen('pin')
              }}
              className="w-full mt-4 py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' }}
            >
              Увійти
            </button>
            
            <button onClick={clearScannedCard} className="w-full mt-2 py-2 text-[#8b949e] text-sm">
              Скасувати
            </button>
          </div>
        </div>
      </ATMLayout>
    )
  }

  return (
    <ATMLayout>
      <div className="w-full flex items-center gap-8">
        <div className="flex-1 flex gap-4">
          <div className="flex-1 bg-[#1a1f26] rounded-xl p-4 border border-[#30363d] text-center">
            <div className="text-3xl mb-2">💳</div>
            <div className="w-6 h-6 rounded-full bg-[#30363d] text-white text-xs font-bold mx-auto mb-2 flex items-center justify-center">1</div>
            <h3 className="text-white font-bold text-sm">Візьміть картку</h3>
            <p className="text-[#8b949e] text-xs mt-1">Підготуйте картку з QR-кодом</p>
          </div>
          
          <div className="flex-1 bg-[#1a1f26] rounded-xl p-4 border border-[#30363d] text-center">
            <div className="text-3xl mb-2">📱</div>
            <div className="w-6 h-6 rounded-full bg-[#30363d] text-white text-xs font-bold mx-auto mb-2 flex items-center justify-center">2</div>
            <h3 className="text-white font-bold text-sm">Покажіть QR</h3>
            <p className="text-[#8b949e] text-xs mt-1">Піднесіть до сканера зліва</p>
          </div>
          
          <div className="flex-1 bg-[#1a1f26] rounded-xl p-4 border border-[#30363d] text-center">
            <div className="text-3xl mb-2">🔐</div>
            <div className="w-6 h-6 rounded-full bg-[#30363d] text-white text-xs font-bold mx-auto mb-2 flex items-center justify-center">3</div>
            <h3 className="text-white font-bold text-sm">Введіть PIN</h3>
            <p className="text-[#8b949e] text-xs mt-1">4-значний код картки</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1f26] border border-[#30363d]">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[#8b949e] text-xs">Очікування...</span>
          </div>
          <div className="text-[#484f58] text-xs">← Сканер зліва</div>
        </div>
      </div>
    </ATMLayout>
  )
}
