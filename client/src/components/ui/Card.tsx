import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

// Monobank-inspired card styles with 3D effects
const cardVariants = {
  default: `
    bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a]
    border border-[#3d3d3d]/50
    shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]
  `,
  elevated: `
    bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a]
    shadow-[0_12px_40px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]
    border border-[#3d3d3d]/30
  `,
  glass: `
    bg-[#2d2d2d]/60 backdrop-blur-xl
    border border-white/[0.08]
    shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
  `,
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        ${cardVariants[variant]}
        ${paddings[padding]}
        rounded-2xl
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { 
        scale: 1.02, 
        y: -6,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 107, 157, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
