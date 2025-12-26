import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { haptics } from '../../utils/haptics'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  haptic?: boolean
}

// Monobank-inspired button styles with 3D effects
const variants = {
  primary: `
    bg-gradient-to-r from-[#ff6b9d] to-[#c44569] text-white
    shadow-[0_6px_20px_rgba(255,107,157,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_8px_28px_rgba(255,107,157,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
    active:shadow-[0_2px_8px_rgba(255,107,157,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]
    border-t border-white/10
  `,
  secondary: `
    bg-gradient-to-b from-[#3d3d3d] to-[#2d2d2d] text-white
    shadow-[0_6px_16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]
    hover:shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]
    hover:from-[#4d4d4d] hover:to-[#3d3d3d]
    active:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(0,0,0,0.3)]
    border-t border-white/5
  `,
  danger: `
    bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white
    shadow-[0_6px_20px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_8px_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
    active:shadow-[0_2px_8px_rgba(239,68,68,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]
    border-t border-white/10
  `,
  ghost: `
    bg-transparent text-[#a0a0a0]
    hover:text-white hover:bg-[#2d2d2d]/50
    hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
  `,
}

const sizes = {
  sm: 'px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base',
  md: 'px-6 py-3 text-base md:px-8 md:py-4 md:text-lg',
  lg: 'px-8 py-4 text-lg min-h-[56px] md:px-10 md:py-5 md:text-xl md:min-h-[64px]',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  haptic = true,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && haptic) {
      haptics.tap()
    }
    onClick?.(e)
  }

  return (
    <motion.button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        font-semibold rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.02, y: -3 }}
      whileTap={disabled ? {} : { scale: 0.98, y: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.button>
  )
}
