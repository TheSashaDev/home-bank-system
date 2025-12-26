import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'

interface AmountInputProps {
  value: number // in kopecks
  onChange: (value: number) => void
  maxAmount?: number // in kopecks
  label?: string
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del']

function formatDisplay(kopecks: number): string {
  const hryvnias = kopecks / 100
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(hryvnias)
}

export function AmountInput({ value, onChange, maxAmount, label }: AmountInputProps) {
  const [inputStr, setInputStr] = useState(value > 0 ? String(value) : '')

  const handleKey = useCallback((key: string) => {
    let newStr = inputStr

    if (key === 'del') {
      newStr = inputStr.slice(0, -1)
    } else if (inputStr.length < 10) {
      newStr = inputStr + key
    }

    const newValue = parseInt(newStr || '0', 10)
    
    if (maxAmount && newValue > maxAmount) return

    setInputStr(newStr)
    onChange(newValue)

    if (navigator.vibrate) navigator.vibrate(10)
  }, [inputStr, onChange, maxAmount])

  const displayValue = inputStr ? parseInt(inputStr, 10) : 0

  return (
    <div className="flex flex-col items-center gap-4">
      {label && <p className="text-[#a0a0a0] text-sm md:text-base">{label}</p>}
      
      {/* Amount display - larger for tablet */}
      <motion.div
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2"
        key={displayValue}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {formatDisplay(displayValue)} <span className="text-[#6b6b6b] text-2xl md:text-3xl">₴</span>
      </motion.div>

      {maxAmount && (
        <p className="text-[#6b6b6b] text-xs md:text-sm">
          Макс: {formatDisplay(maxAmount)} ₴
        </p>
      )}

      {/* Keypad - larger for tablet */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {keys.map((key, idx) => (
          <motion.button
            key={idx}
            type="button"
            onClick={() => handleKey(key)}
            className={`
              w-16 h-14 md:w-20 md:h-18 lg:w-24 lg:h-20
              rounded-xl text-xl md:text-2xl lg:text-3xl font-semibold
              ${key === 'del'
                ? 'bg-[#2d2d2d]/50 text-[#6b6b6b]'
                : 'bg-[#2d2d2d] text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
              }
              active:scale-95
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, backgroundColor: 'rgba(255, 107, 157, 0.2)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {key === 'del' ? '⌫' : key}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
