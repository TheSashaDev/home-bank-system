import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'

interface PinPadProps {
  onComplete: (pin: string) => void
  onCancel?: () => void
  maxLength?: number
  error?: string
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export function PinPad({ onComplete, onCancel, maxLength = 4, error }: PinPadProps) {
  const [pin, setPin] = useState('')

  const handleKey = useCallback((key: string) => {
    if (key === 'del') {
      setPin(p => p.slice(0, -1))
      return
    }
    if (key === '' || pin.length >= maxLength) return

    const newPin = pin + key
    setPin(newPin)

    // vibrate on tap if available
    if (navigator.vibrate) navigator.vibrate(10)

    if (newPin.length === maxLength) {
      setTimeout(() => {
        onComplete(newPin)
        setPin('')
      }, 150)
    }
  }, [pin, maxLength, onComplete])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots - larger for tablet */}
      <div className="flex gap-4 md:gap-6 mb-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 ${
              i < pin.length
                ? 'bg-[#ff6b9d] border-[#ff6b9d] shadow-[0_0_12px_rgba(255,107,157,0.6)]'
                : 'bg-transparent border-[#3d3d3d]'
            }`}
            animate={i < pin.length ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#ef4444] text-sm md:text-base"
        >
          {error}
        </motion.p>
      )}

      {/* Keypad with 3D effects - larger for tablet */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {keys.map((key, idx) => (
          <motion.button
            key={idx}
            type="button"
            disabled={key === ''}
            onClick={() => handleKey(key)}
            className={`
              w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
              rounded-2xl text-2xl md:text-3xl lg:text-4xl font-semibold
              ${key === '' ? 'invisible' : ''}
              ${key === 'del'
                ? 'bg-gradient-to-b from-[#3d3d3d] to-[#2d2d2d] text-[#6b6b6b] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'bg-gradient-to-b from-[#3d3d3d] to-[#2d2d2d] text-white shadow-[0_6px_16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]'
              }
              disabled:opacity-0
              border-t border-white/5
              active:scale-95
            `}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ 
              scale: 0.95, 
              y: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(0,0,0,0.3)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {key === 'del' ? '⌫' : key}
          </motion.button>
        ))}
      </div>

      {onCancel && (
        <motion.button
          onClick={onCancel}
          className="mt-4 text-[#6b6b6b] hover:text-white transition-colors text-base md:text-lg py-2 px-4"
          whileTap={{ scale: 0.95 }}
        >
          Скасувати
        </motion.button>
      )}
    </div>
  )
}
