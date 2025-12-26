import { useAppStore } from '../../store/appStore';

export function ScanNotification() {
  const { scannedCard, clearScannedCard } = useAppStore();

  if (!scannedCard) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-500 text-white rounded-lg shadow-xl p-4 min-w-[300px]">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm opacity-80">Карта отсканирована</div>
            <div className="text-xl font-bold mt-1">{scannedCard.name}</div>
            <div className="text-sm mt-2 opacity-90">
              Карта: {scannedCard.cardNumber}
            </div>
            <div className="text-lg font-semibold mt-1">
              Баланс: {scannedCard.balance.toLocaleString()} ₽
            </div>
          </div>
          <button
            onClick={clearScannedCard}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
