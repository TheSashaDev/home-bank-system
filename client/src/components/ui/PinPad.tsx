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

    if (newPin.length === maxLength) {
      setTimeout(() => {
        onComplete(newPin)
        setPin('')
      }, 100)
    }
  }, [pin, maxLength, onComplete])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 mb-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 ${
              i < pin.length
                ? 'bg-[#ff6b9d] border-[#ff6b9d]'
                : 'bg-transparent border-[#3d3d3d]'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-[#ef4444] text-sm">{error}</p>}

      <div className="grid grid-cols-3 gap-2">
        {keys.map((key, idx) => (
          <button
            key={idx}
            type="button"
            disabled={key === ''}
            onClick={() => handleKey(key)}
            className={`
              w-16 h-14 rounded-xl text-xl font-semibold
              ${key === '' ? 'invisible' : ''}
              ${key === 'del'
                ? 'bg-[#2d2d2d] text-[#6b6b6b]'
                : 'bg-[#2d2d2d] text-white'
              }
              active:bg-[#3d3d3d]
            `}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>

      {onCancel && (
        <button onClick={onCancel} className="mt-2 text-[#6b6b6b] text-sm">
          Скасувати
        </button>
      )}
    </div>
  )
}
